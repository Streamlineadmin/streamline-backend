const { Op, where } = require('sequelize');
const { documentTypes } = require('../helpers/document-type');
const { generateProductionId, generateTransferNumber } = require('../helpers/transfer-number');
const models = require('../models');
const { buildMultiLevelProductionTree, isValidJSON, secondsToTime, timeToSeconds } = require('../helpers/add-level');
const e = require('express');

async function startProduction(req, res) {
    try {
        const { companyId, productions, mto, prefix, nextNumber } = req.body;
        const settings = await models.Settings.findOne({
            where: {
                companyId: Number(companyId)
            },
            raw: true
        });
        const bulkProduction = productions.map(production => ({
            companyId: Number(companyId),
            productionId: production?.productionId || generateProductionId(),
            documentNumber: production?.documentNumber,
            bomId: production.bomId,
            productionEndDate: production.productionEndDate,
            assignedTo: production.assignedTo,
            createdBy: Number(companyId),
            status: 1,
            mto: mto ?? 0,
            isManual: {
                productionFinishedGood: settings?.['productionFinishedGood'],
                productionScrapMaterial: settings?.['productionScrapMaterial'],
                productionRawMaterial: settings?.['productionRawMaterial']
            }
        }));
        const bulkProductions = await models.Production.bulkCreate(bulkProduction);
        const bulkProductionItems = bulkProductions.map((production, index) => ({
            productionId: production.id,
            documentNumber: productions[index].documentNumber,
            itemId: productions[index].itemId,
            itemName: productions[index].itemName,
            UOM: productions[index].UOM,
            quantity: productions[index].quantity,
            status: 1
        }));
        await models.ProductionItems.bulkCreate(bulkProductionItems);
        let index = 0;
        for (const production of bulkProductions) {
            const [scrapLogs, rawMaterials, finishedGoods, productionProcess, additionalCharges] = await Promise.all([
                models.BOMScrapMaterial.findAll({ where: { bomId: production.bomId } }),
                models.BOMRawMaterial.findAll({ where: { bomId: production.bomId }, order: [["createdAt", "ASC"]] }),
                models.BOMFinishedGoods.findAll({ where: { bomId: production.bomId } }),
                models.BOMProductionProcess.findAll({ where: { bomId: production.bomId } }),
                models.BOMAdditionalCharges.findAll({ where: { bomId: production.bomId } }),
            ]);

            const productionProcessId = productionProcess.map(data => data.processId);

            const process = await models.ProductionProcess.findAll({
                where: {
                    id: {
                        [Op.in]: productionProcessId
                    }
                }
            });

            const itemsId = [];
            scrapLogs.forEach((data) => itemsId.push(data.itemId));
            rawMaterials.forEach((data) => itemsId.push(data.itemId));
            finishedGoods.forEach((data) => itemsId.push(data.itemId));

            const items = await models.Items.findAll({
                where: {
                    itemId: {
                        [Op.in]: itemsId
                    },
                    companyId: Number(companyId)
                },
                raw: true
            });
            const itemsMap = items?.reduce((acc, curr) => {
                acc[curr.itemId] = curr;
                return acc;
            }, {});
            const ids = items?.map(item => item.id);
            const alternateUnits = await models.AlternateUnits.findAll({
                where: {
                    itemId: {
                        [Op.in]: ids
                    }
                }, raw: true
            });

            const idToElementMap = {};
            const parentProductionId = {}, parentProductionKey = {}, currentChildCount = {};
            const childs = rawMaterials?.reduce((acc, curr) => {
                idToElementMap[curr.id] = curr;
                if (curr.parentId) {
                    if (acc[curr.parentId]) acc[curr.parentId].push(curr);
                    else acc[curr.parentId] = [curr];
                }
                return acc;
            }, {});
            // const parentToChildMap = rawMaterials.reduce((acc, curr) => {
            //     if (curr.parentId) {
            //         acc[curr.id] = idToElementMap[curr.parentId];
            //     }
            //     return acc;
            // }, {});

            const quantMap = {};


            for (const element of rawMaterials) {
                if (!element.parentId) {
                    quantMap[element.id] = (element.quantity / finishedGoods[0].quantity) * productions[index].quantity
                }
                console.log(quantMap, "quantmap")
                if (childs[element.id]) {
                    currentChildCount[element.parentId] = (currentChildCount[element.parentId] || 0) + 1;
                    const prod = await models.Production.create({
                        companyId: Number(companyId),
                        productionId: (parentProductionKey[element.parentId] || production.productionId) + `-C${currentChildCount[element.parentId]}`,
                        documentNumber: production?.documentNumber,
                        bomId: element.finishedGoodBomId,
                        productionEndDate: production.productionEndDate,
                        assignedTo: production.assignedTo,
                        createdBy: Number(companyId),
                        status: 1,
                        mto: mto ?? 0,
                        parentProductionId: parentProductionId[element.parentId] || production.id,
                        isManual: {
                            productionFinishedGood: settings?.['productionFinishedGood'],
                            productionScrapMaterial: settings?.['productionScrapMaterial'],
                            productionRawMaterial: settings?.['productionRawMaterial']
                        }
                    });

                    const [scrapLogs, childFinishedGoods, productionProcess, additionalCharges] = await Promise.all([
                        models.BOMScrapMaterial.findAll({ where: { bomId: element.finishedGoodBomId } }),
                        models.BOMFinishedGoods.findAll({ where: { bomId: element.finishedGoodBomId } }),
                        models.BOMProductionProcess.findAll({ where: { bomId: element.finishedGoodBomId } }),
                        models.BOMAdditionalCharges.findAll({ where: { bomId: element.finishedGoodBomId } }),
                    ]);

                    const finishedGoodsQuantity = quantMap[element.id];
                    const productionProcessId = productionProcess.map(data => data.processId);
                    const process = await models.ProductionProcess.findAll({
                        where: {
                            id: {
                                [Op.in]: productionProcessId
                            }
                        }
                    });
                    const rawMaterial = childs[element.id];
                    const bulkRawMaterial = rawMaterial?.map((data) => {
                        const quantity = (data.quantity) / childFinishedGoods[0]?.quantity;
                        let conversionFactor = 1;
                        // if (data.uom != itemsMap[data.itemId]?.metricsUnit) {
                        //     for (const element of alternateUnits) {
                        //         console.log(element.itemId, itemsMap[data.itemId]?.id, element.id, data.uom)
                        //         if (element.itemId == itemsMap[data.itemId]?.id && element.alternateUnits == data.uom) {
                        //             conversionFactor = element.conversionfactor;
                        //             break;
                        //         }
                        //     }
                        // }
                        quantMap[data.id] = quantMap[data.parentId] * quantity;
                        return {
                            productionId: prod.id,
                            itemId: data.itemId,
                            itemName: data.itemName,
                            store: data.store,
                            uom: data.uom,
                            quantity: quantMap[data.parentId] * quantity,
                            conversionFactor,
                            status: 1,
                            alternateFor: data.alternateFor || null
                        }
                    });

                    const bulkAdditionalCharges = additionalCharges?.filter(data => data.chargesName).map((data) => {
                        const price = (data.amount) / childFinishedGoods[0]?.quantity;
                        return {
                            productionId: prod.id,
                            chargesName: data.chargesName,
                            amount: finishedGoodsQuantity * price,
                            status: 1
                        }
                    });

                    const bulkScrapMaterial = scrapLogs?.filter(data => data?.itemName).map((data) => {
                        const quantity = (data.quantity) / childFinishedGoods[0]?.quantity;
                        let conversionFactor = 1;
                        // if (data.uom != itemsMap[data.itemId]?.metricsUnit) {
                        //     for (const element of alternateUnits) {
                        //         if (element.itemId == itemsMap[data.itemId]?.id && element.alternateUnits == data.uom) {
                        //             conversionFactor = element.conversionfactor;
                        //             break;
                        //         }
                        //     }
                        // }
                        return {
                            productionId: prod.id,
                            itemId: data.itemId,
                            itemName: data.itemName,
                            uom: data.uom,
                            quantity: finishedGoodsQuantity * quantity,
                            store: data.store,
                            costAllocationPercent: data.costAllocationPercent,
                            conversionFactor,
                            status: 1,
                            alternateFor: data.alternateFor || null
                        }
                    });

                    const bulkFinishedGoods = childFinishedGoods.map((data) => {
                        let conversionFactor = 1;
                        // if (data.uom != itemsMap[data.itemId]?.metricsUnit) {
                        //     for (const element of alternateUnits) {
                        //         if (element.itemId == itemsMap[data.itemId]?.id && element.alternateUnits == data.uom) {
                        //             conversionFactor = element.conversionfactor;
                        //             break;
                        //         }
                        //     }
                        // }
                        return {
                            productionId: prod.id,
                            itemId: data.itemId,
                            itemName: data.itemName,
                            uom: data.uom,
                            quantity: finishedGoodsQuantity,
                            store: data.store,
                            costAllocationPercent: data.costAllocationPercent,
                            conversionFactor,
                            status: 1
                        }
                    });

                    const bulkProcess = process.map((data) => {

                        const [days, hours, minutes, seconds] = !data?.plannedTime ? [0, 0, 0, 0] : data?.plannedTime?.split(":")?.map(Number);
                        const totalMinutes = (((days * 24) + hours) * 60) + minutes;
                        const miniute = (finishedGoodsQuantity) * (totalMinutes / childFinishedGoods[0]?.quantity);
                        const totalSeconds = (miniute * 60) + seconds;

                        const day = Math.floor(totalSeconds / (24 * 3600));
                        const remainingAfterDays = totalSeconds % (24 * 3600);

                        const hour = Math.floor(remainingAfterDays / 3600);
                        const minute = Math.floor((remainingAfterDays % 3600) / 60);
                        const second = Math.floor(remainingAfterDays % 60) || 0;

                        const timeString = `${String(day).padStart(2, '0')}:${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;

                        return {
                            productionId: prod.id,
                            cost: (miniute / data.cost) * 60,
                            plannedTime: timeString,
                            description: data.description,
                            processName: data.processName,
                            status: 1,
                            perHourCost: (data?.cost / totalMinutes) * 60
                        }
                    });

                    await Promise.all([
                        models.ProductionSalesProcess.bulkCreate(bulkProcess),
                        models.ProductionRawMaterials.bulkCreate(bulkRawMaterial),
                        models.ProductionScrapMaterials.bulkCreate(bulkScrapMaterial),
                        models.ProductionFinishedGoods.bulkCreate(bulkFinishedGoods),
                        models.ProductionAdditionalCharges.bulkCreate(bulkAdditionalCharges),
                    ]);

                    parentProductionId[element.id] = prod.id;
                    parentProductionKey[element.id] = prod.productionId;
                }
            }

            const bulkRawMaterial = rawMaterials?.filter(data => !data.parentId).map((data) => {
                const quantity = (data.quantity) / finishedGoods[0]?.quantity;
                let conversionFactor = 1;
                if (data.uom != itemsMap[data.itemId]?.metricsUnit) {
                    for (const element of alternateUnits) {
                        if (element.itemId == itemsMap[data.itemId]?.id && element.alternateUnits == data.uom) {
                            conversionFactor = element.conversionfactor;
                            break;
                        }
                    }
                }
                return {
                    productionId: production.id,
                    itemId: data.itemId,
                    itemName: data.itemName,
                    store: data.store,
                    uom: data.uom,
                    quantity: productions[index].quantity * quantity,
                    conversionFactor,
                    status: 1,
                    alternateFor: data.alternateFor || null
                }
            });

            const bulkAdditionalCharges = additionalCharges?.filter(data => data.chargesName).map((data) => {
                const price = (data.amount) / finishedGoods[0]?.quantity;
                return {
                    productionId: production.id,
                    chargesName: data.chargesName,
                    amount: productions[index].quantity * price,
                    status: 1
                }
            });

            const bulkScrapMaterial = scrapLogs?.filter(data => data?.itemName).map((data) => {
                const quantity = (data.quantity) / finishedGoods[0]?.quantity;
                let conversionFactor = 1;
                if (data.uom != itemsMap[data.itemId]?.metricsUnit) {
                    for (const element of alternateUnits) {
                        if (element.itemId == itemsMap[data.itemId]?.id && element.alternateUnits == data.uom) {
                            conversionFactor = element.conversionfactor;
                            break;
                        }
                    }
                }
                return {
                    productionId: production.id,
                    itemId: data.itemId,
                    itemName: data.itemName,
                    uom: data.uom,
                    quantity: productions[index].quantity * quantity,
                    store: data.store,
                    costAllocationPercent: data.costAllocationPercent,
                    conversionFactor,
                    status: 1,
                    alternateFor: data.alternateFor || null
                }
            });

            const bulkFinishedGoods = finishedGoods.map((data) => {
                let conversionFactor = 1;
                if (data.uom != itemsMap[data.itemId]?.metricsUnit) {
                    for (const element of alternateUnits) {
                        if (element.itemId == itemsMap[data.itemId]?.id && element.alternateUnits == data.uom) {
                            conversionFactor = element.conversionfactor;
                            break;
                        }
                    }
                }
                return {
                    productionId: production.id,
                    itemId: data.itemId,
                    itemName: data.itemName,
                    uom: data.uom,
                    quantity: productions[index].quantity,
                    store: data.store,
                    costAllocationPercent: data.costAllocationPercent,
                    conversionFactor,
                    status: 1
                }
            });

            const bulkProcess = process.map((data) => {

                const [days, hours, minutes, seconds] = !data?.plannedTime ? [0, 0, 0, 0] : data?.plannedTime?.split(":")?.map(Number);
                const totalMinutes = (((days * 24) + hours) * 60) + minutes;
                const miniute = (productions[index]?.quantity) * (totalMinutes / finishedGoods[0]?.quantity);
                const totalSeconds = (miniute * 60) + seconds;

                const day = Math.floor(totalSeconds / (24 * 3600));
                const remainingAfterDays = totalSeconds % (24 * 3600);

                const hour = Math.floor(remainingAfterDays / 3600);
                const minute = Math.floor((remainingAfterDays % 3600) / 60);
                const second = Math.floor(remainingAfterDays % 60) || 0;

                const timeString = `${String(day).padStart(2, '0')}:${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;

                return {
                    productionId: production.id,
                    cost: (miniute / data.cost) * 60,
                    plannedTime: timeString,
                    description: data.description,
                    processName: data.processName,
                    status: 1,
                    perHourCost: (data?.cost / totalMinutes) * 60
                }
            });

            await Promise.all([
                models.ProductionSalesProcess.bulkCreate(bulkProcess),
                models.ProductionRawMaterials.bulkCreate(bulkRawMaterial),
                models.ProductionScrapMaterials.bulkCreate(bulkScrapMaterial),
                models.ProductionFinishedGoods.bulkCreate(bulkFinishedGoods),
                models.ProductionAdditionalCharges.bulkCreate(bulkAdditionalCharges),
            ]);
            index++;
        }
        if (prefix && nextNumber) {
            await models.DocumentSeries.update(
                { nextNumber: nextNumber + productions.length },
                {
                    where: {
                        companyId: Number(companyId),
                        DocType: 'Production',
                        prefix
                    }
                }
            );
        }

        res.status(201).json({ message: 'Production Created Successfully.', productions: bulkProductions?.map(item => item.get({ plain: true })) });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong' });
        console.log(error);
    }
}

async function getProductions(req, res) {
    try {
        const { companyId, endDate, startDate } = req.body;
        let finalStartDate;
        let finalEndDate;

        if (startDate && endDate) {
            finalStartDate = new Date(startDate);
            finalEndDate = new Date(endDate);
            finalStartDate.setDate(finalStartDate.getDate() - 1);
            finalEndDate.setDate(finalEndDate.getDate() + 1);
        } else {
            finalEndDate = new Date();
            finalStartDate = new Date();
            finalStartDate.setDate(finalEndDate.getDate() - 7);
            finalStartDate.setDate(finalStartDate.getDate() - 1);
            finalEndDate.setDate(finalEndDate.getDate() + 1);
        }
        const salesDocuments = await models.Documents.findAll({
            where: {
                companyId: Number(companyId),
                documentType: {
                    [Op.in]: [documentTypes.salesOrder, 'Service Confirmation Grn']
                },
                status: {
                    [Op.notIn]: [0, 2]
                },
                createdAt: {
                    [Op.between]: [finalStartDate, finalEndDate]
                }
            },
            raw: true,
            order: [['createdAt', 'DESC']],
            attributes: [
                "id",
                "documentNumber",
                "companyId",
                "createdAt",
                "status",
                "requestedBy",
                "deliveryDate",
                "documentType",
                "purchaseOrderNumber"
            ],
        });
        const salesDocumentsId = salesDocuments.map(doc => doc.documentNumber);
        const productions = await models.Production.findAll({
            where: {
                companyId: Number(companyId),
                bulkProductionId: null,
                status: {
                    [Op.ne]: 0
                },
                createdAt: {
                    [Op.between]: [finalStartDate, finalEndDate]
                }
            },
            raw: true
        });
        const itemsData = await models.DocumentItems.findAll({
            where: {
                companyId: Number(companyId),
                documentNumber: {
                    [Op.in]: salesDocumentsId
                }
            },
            raw: true
        });
        const itemsMap = itemsData.reduce((acc, current) => {
            if (acc[current.documentNumber]) acc[current.documentNumber].push(current);
            else acc[current.documentNumber] = [current];
            return acc;
        }, {});

        for (const element of salesDocuments) {
            element.items = (itemsMap[element.documentNumber] || [])?.filter((item) => element.documentType != 'Service Confirmation Grn' || item.type == 'Finished Good');
        }
        const productionsIds = productions.map(prod => prod.id);
        const productionItems = await models.ProductionFinishedGoods.findAll({
            where: {
                productionId: {
                    [Op.in]: productionsIds
                }
            },
            raw: true
        });
        const productionItemsMap = productionItems.reduce((acc, current) => {
            acc[current.productionId] = current;
            return acc;
        }, {});
        for (const element of productions) {
            if (productionItemsMap[element.id]) {
                element.productionItem = productionItemsMap[element.id];
                if (element.documentNumber) {
                    element.productionItem.customFields = itemsMap?.[element.documentNumber]?.[element?.productionItem?.itemId]?.customFields;
                }
            }
        }
        const productionMap = productions.reduce((acc, current) => {
            if (acc[current.documentNumber]) {
                if (acc[current.documentNumber][current?.productionItem?.itemId]) {
                    acc[current.documentNumber][current?.productionItem?.itemId].push(current);
                }
                else
                    acc[current.documentNumber][current?.productionItem?.itemId] = [current];
            }
            else {
                acc[current?.documentNumber] = {};
                acc[current?.documentNumber][current?.productionItem?.itemId] = [current];
            }
            return acc;
        }, {});

        for (const salesDocument of salesDocuments) {
            const items = [];
            for (const item of salesDocument.items) {
                if (productionMap[salesDocument.documentNumber] && productionMap[salesDocument.documentNumber][item.itemId]) {
                    for (const element of productionMap[salesDocument.documentNumber][item.itemId]) {
                        items.push({ ...item, production: element });
                    }
                }
                else {
                    item.production = {};
                    items.push(item);
                }
            }
            salesDocument.items = items;
        }
        const manualProductions = [];
        for (const element of productions) {
            if (!element.documentNumber) {
                manualProductions.push({
                    items: [{ production: element }]
                });
            }
        }

        return res.status(200).json({ salesDocuments: [...manualProductions, ...salesDocuments] });


    } catch (error) {
        res.status(500).json({ message: 'Something went wrong' });
        console.log(error);
    }
}

async function getBulkProductions(req, res) {
    try {
        const { companyId, startDate, endDate } = req.body;
        let finalStartDate;
        let finalEndDate;

        if (startDate && endDate) {
            finalStartDate = new Date(startDate);
            finalEndDate = new Date(endDate);
            finalStartDate.setDate(finalStartDate.getDate() - 1);
            finalEndDate.setDate(finalEndDate.getDate() + 1);
        } else {
            finalEndDate = new Date();
            finalStartDate = new Date();
            finalStartDate.setDate(finalEndDate.getDate() - 7);
            finalStartDate.setDate(finalStartDate.getDate() - 1);
            finalEndDate.setDate(finalEndDate.getDate() + 1);
        }
        const bulkProductions = await models.BulkProduction.findAll({
            where: {
                companyId,
                createdAt: {
                    [Op.between]: [finalStartDate, finalEndDate]
                }
            },
            raw: true
        });

        const bulkProductionsMap = bulkProductions.reduce((acc, curr) => {
            acc[curr.id] = curr;
            return acc;
        }, {});
        const productions = await models.Production.findAll({
            where: {
                bulkProductionId: {
                    [Op.in]: bulkProductions.map(data => data.id)
                },
                status: {
                    [Op.ne]: 0
                }
            },
            raw: true
        });
        const productionsMap = productions.reduce((acc, curr) => {
            acc[curr.id] = curr;
            return acc;
        }, {});

        const finishedGoods = await models.ProductionFinishedGoods.findAll({
            where: {
                productionId: {
                    [Op.in]: Object.keys(productionsMap)
                }
            },
            raw: true,
            order: [['createdAt', 'DESC']]
        });
        const arr = []

        for (const element of finishedGoods) {
            arr.push({
                ...element,
                ...productionsMap[element.productionId],
                ...bulkProductionsMap[productionsMap[element.productionId].bulkProductionId]
            });
        }

        return res.status(200).json({ bulkProductions: arr });


    } catch (error) {
        res.status(500).json({ message: 'Something went wrong' });
        console.log(error);
    }
}

async function getProductionAndDescendants(productionId) {
    const result = [];

    async function collect(id) {
        const production = await models.Production.findOne({
            where: { id },
            raw: true
        });

        if (!production) return;

        result.push(production);

        const children = await models.Production.findAll({
            where: { parentProductionId: id },
            raw: true
        });

        for (const child of children) {
            await collect(child.id);
        }
    }

    await collect(productionId);
    return result;
}

async function getProductionById(req, res) {
    try {
        const { productionId } = req.body;
        const production = await models.Production.findOne({
            where: {
                id: Number(productionId)
            },
            raw: true
        });
        const isRawMaterialLock = await models.InventoryApproval.findOne({
            where: {
                documentType: 'Raw Material',
                documentNumber: production.id,
                approvalStatus: 'Pending'
            }
        });
        const isScrapMaterialLock = await models.InventoryApproval.findOne({
            where: {
                documentType: 'Scrap Material',
                documentNumber: production.id,
                approvalStatus: 'Pending'
            }
        });

        const isFinishedGoodLock = await models.InventoryApproval.findOne({
            where: {
                documentType: 'Finished Good',
                documentNumber: production.id,
                approvalStatus: 'Pending'
            }
        });
        const [salesOrder, productionItem, bom, scrapLogs, rawMaterials, finishedGoods, process, additionalCharges] = await Promise.all([
            models.Documents.findOne({ where: { documentNumber: production?.documentNumber || '' } }),
            models.ProductionItems.findOne({ where: { productionId: production.id } }),
            models.BOMDetails.findOne({ where: { id: production.bomId } }),
            models.ProductionScrapMaterials.findAll({ where: { productionId: production.id }, raw: true }),
            models.ProductionRawMaterials.findAll({ where: { productionId: production.id }, raw: true }),
            models.ProductionFinishedGoods.findAll({ where: { productionId: production.id } }),
            models.ProductionSalesProcess.findAll({ where: { productionId: production.id } }),
            models.ProductionAdditionalCharges.findAll({ where: { productionId: production.id } }),
        ]);

        const multilevelProducions = await getProductionAndDescendants(Number(productionId));
        const multiFinishedGoods = await models.ProductionFinishedGoods.findAll({
            where: {
                productionId: {
                    [Op.in]: multilevelProducions?.map(data => data.id)
                }
            },
            raw: true
        });

        let isMulti = null;

        if (multilevelProducions.length > 1) {
            const multiFinishedGoodsMap = multiFinishedGoods.reduce((acc, curr) => {
                acc[curr.productionId] = curr;
                return acc;
            }, {});
            const multiLevelProducionsWithFinishedGoods = multilevelProducions.map((data, index) => {
                return {
                    ...data,
                    parentProductionId: index == 0 ? null : data.parentProductionId,
                    finishedGood: multiFinishedGoodsMap[data.id]
                }
            });
            isMulti = buildMultiLevelProductionTree(multiLevelProducionsWithFinishedGoods);
        }

        let customFields = {};
        if (production?.documentNumber) {
            const documentItem = await models.DocumentItems.findOne({
                where: {
                    documentNumber: production?.documentNumber,
                    companyId: production.companyId,
                    itemId: finishedGoods[0]?.itemId
                }
            });
            customFields = documentItem?.customFields || {}
        }

        const alternateMap = {};
        const alternateScrapMap = {};
        rawMaterials.forEach(item => {
            if (item.alternateFor) {
                if (!alternateMap[item.alternateFor]) {
                    alternateMap[item.alternateFor] = [];
                }
                alternateMap[item.alternateFor].push(item);
            }
        });

        scrapLogs.forEach(item => {
            if (item.alternateFor) {
                if (!alternateScrapMap[item.alternateFor]) {
                    alternateScrapMap[item.alternateFor] = [];
                }
                alternateScrapMap[item.alternateFor].push(item);
            }
        });

        const newScrap = scrapLogs.filter(item => !item.alternateFor).map(item => {
            if (alternateScrapMap[item.itemId]) {
                item.alternates = [{ ...item }, ...(alternateScrapMap[item.itemId])];
            }
            else {
                item.alternates = [{ ...item }];
            }
            return item;
        });

        const newRaw = rawMaterials.filter(item => !item.alternateFor).map(item => {
            if (alternateMap[item.itemId]) {
                item.alternates = [{ ...item }, ...(alternateMap[item.itemId])];
            }
            else {
                item.alternates = [{ ...item }];
            }
            return item;
        });

        res.status(200).json({
            message: 'Production Data Fetched.',
            productionData: {
                salesOrder,
                production,
                productionItem,
                bom,
                scrapLogs: newScrap,
                rawMaterials: newRaw,
                finishedGoods: [{ ...finishedGoods[0]?.toJSON(), customFields }],
                additionalCharges,
                process,
                isMulti,
                isRawMaterialLock: isRawMaterialLock ? true : false,
                isScrapMaterialLock: isScrapMaterialLock ? true : false,
                isFinishedGoodLock: isFinishedGoodLock ? true : false
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong' });
        console.log('Error here', error);
    }
}

async function bulkGetProductionsByIds(req, res) {
    try {
        const { productionId } = req.body;
        const bulkProduction = await models.BulkProduction.findByPk(productionId);

        // Validate input
        const childProductions = await models.Production.findAll({
            where: {
                bulkProductionId: productionId
            }
        });
        const productionIds = childProductions.map(child => child.id);
        if (!Array.isArray(productionIds) || productionIds.length === 0) {
            return res.status(400).json({
                message: 'productionIds must be a non-empty array'
            });
        }

        // Convert to numbers and filter valid IDs
        const validProductionIds = productionIds
            .map(id => Number(id))
            .filter(id => !isNaN(id) && id > 0);

        if (validProductionIds.length === 0) {
            return res.status(400).json({
                message: 'No valid production IDs provided'
            });
        }

        // Fetch all productions
        const productions = await models.Production.findAll({
            where: {
                id: validProductionIds
            },
            raw: true
        });

        if (productions.length === 0) {
            return res.status(404).json({
                message: 'No productions found for the provided IDs'
            });
        }

        // Extract document numbers and production IDs for bulk queries
        const documentNumbers = productions
            .map(p => p.documentNumber)
            .filter(Boolean);
        const foundProductionIds = productions.map(p => p.id);
        const bomIds = productions
            .map(p => p.bomId)
            .filter(Boolean);

        // Fetch all related data in parallel
        const [
            salesOrders,
            productionItems,
            boms,
            allScrapLogs,
            allRawMaterials,
            allFinishedGoods,
            allProcesses,
            allAdditionalCharges
        ] = await Promise.all([
            models.Documents.findAll({
                where: { documentNumber: documentNumbers },
                raw: true
            }),
            models.ProductionItems.findAll({
                where: { productionId: foundProductionIds },
                raw: true
            }),
            models.BOMDetails.findAll({
                where: { id: bomIds },
                raw: true
            }),
            models.ProductionScrapMaterials.findAll({
                where: { productionId: foundProductionIds },
                raw: true
            }),
            models.ProductionRawMaterials.findAll({
                where: { productionId: foundProductionIds },
                raw: true
            }),
            models.ProductionFinishedGoods.findAll({
                where: { productionId: foundProductionIds },
                raw: true
            }),
            models.ProductionSalesProcess.findAll({
                where: { productionId: foundProductionIds },
                raw: true
            }),
            models.ProductionAdditionalCharges.findAll({
                where: { productionId: foundProductionIds },
                raw: true
            })
        ]);

        // Group related data by production ID
        const groupByProductionId = (items) => {
            return items.reduce((acc, item) => {
                if (!acc[item.productionId]) {
                    acc[item.productionId] = [];
                }
                acc[item.productionId].push(item);
                return acc;
            }, {});
        };

        // Group related data by document number
        const salesOrdersByDocNumber = salesOrders.reduce((acc, order) => {
            acc[order.documentNumber] = order;
            return acc;
        }, {});

        // Group related data by BOM ID
        const bomsByBomId = boms.reduce((acc, bom) => {
            acc[bom.id] = bom;
            return acc;
        }, {});

        // Group all related data
        const productionItemsByProductionId = productionItems.reduce((acc, item) => {
            acc[item.productionId] = item;
            return acc;
        }, {});

        const scrapLogsByProductionId = groupByProductionId(allScrapLogs);
        const rawMaterialsByProductionId = groupByProductionId(allRawMaterials);
        const finishedGoodsByProductionId = groupByProductionId(allFinishedGoods);
        const processesByProductionId = groupByProductionId(allProcesses);
        const additionalChargesByProductionId = groupByProductionId(allAdditionalCharges);

        // Build the response data
        const productionsData = productions.map(production => {
            return {
                bulkProduction,
                salesOrder: salesOrdersByDocNumber[production.documentNumber] || null,
                production,
                productionItem: productionItemsByProductionId[production.id] || null,
                bom: bomsByBomId[production.bomId] || null,
                scrapLogs: scrapLogsByProductionId[production.id] || [],
                rawMaterials: rawMaterialsByProductionId[production.id] || [],
                finishedGoods: finishedGoodsByProductionId[production.id] || [],
                process: processesByProductionId[production.id] || [],
                additionalCharges: additionalChargesByProductionId[production.id] || []
            };
        });

        res.status(200).json({
            message: 'Bulk Production Data Fetched.',
            productionsData,
        });

    } catch (error) {
        res.status(500).json({ message: 'Something went wrong' });
        console.log(error);
    }
}

async function issueRawMaterial(req, res) {
    try {
        const { rawMaterialData, companyId, userId, by } = req.body;
        const uoms = await models.UOM.findAll({
            where: {
                [Op.or]: [
                    { companyId: companyId, status: 1 },
                    { companyId: null, status: 0 }
                ]
            },
            raw: true
        });
        const uomMap = uoms.reduce((acc, curr) => {
            acc[curr.id] = curr.code;
            return acc;
        }, {});
        if (!rawMaterialData || rawMaterialData.length === 0) {
            return res.status(400).json({ message: 'No raw material data provided.' });
        }
        const production = await models.Production.findOne({
            where: { id: rawMaterialData[0]?.productionId }
        });
        if (!production) {
            return res.status(404).json({ message: 'Production not found.' });
        }
        await production.update({
            status: 2, ...(production.productionStartDate
                ? {}
                : { productionStartDate: new Date().toISOString() })
        });
        const settings = isValidJSON(production?.isManual) || {}
        const approvalCount = await models.InventoryApproval.count({
            where: {
                companyId
            }
        });
        const approval = await models.InventoryApproval.create({
            approvalId: `INA${approvalCount + 1}`,
            documentType: 'Raw Material',
            documentNumber: production.id,
            approvalStatus: settings?.['productionRawMaterial'] == 'manual' ? 'Pending' : 'Auto Approved',
            requestedBy: userId,
            companyId: companyId,
            status: 1,
            approvedBy: null
        });
        const [stores, items] = await Promise.all([
            models.Store.findAll({ where: { companyId: Number(companyId) } }),
            models.Items.findAll({ where: { companyId } })
        ]);
        const storeMap = new Map(stores.map(store => [store.name, store]));
        const itemMap = new Map(items.map(item => [item.itemId, item]));
        const stockTransferPayloads = [];
        for (const element of rawMaterialData) {
            if (!element?.issuedToday || element.issuedToday === '0' || element.issuedToday === 0) continue;
            const storeName = element.store?.replaceAll("-fromrejectstore", "");
            const store = storeMap.get(storeName);
            const item = itemMap.get(element.itemId);
            if (!store || !item) continue;
            const isRejected = element?.isReject || false;
            if (settings?.['productionRawMaterial'] != 'manual') {
                const existingStock = await models.StoreItems.findAll({
                    where: {
                        storeId: store.id,
                        itemId: item.id,
                        isRejected
                    },
                    order: [['createdAt', 'ASC']]
                });
                let price = 0;
                let remainingQuantity = element.issuedToday * (element?.conversionFactor || 1);
                for (const stock of existingStock) {
                    if (remainingQuantity <= 0) break;
                    if (stock.quantity <= 0) continue;
                    const deductQty = Math.min(stock.quantity, remainingQuantity);
                    remainingQuantity -= deductQty;
                    await stock.update({ quantity: stock.quantity - deductQty });
                    stockTransferPayloads.push({
                        transferNumber: generateTransferNumber(),
                        fromStoreId: store.id,
                        itemId: item.id,
                        quantity: -deductQty,
                        toStoreId: null,
                        transferDate: new Date().toISOString(),
                        transferredBy: userId,
                        companyId,
                        price: stock.price,
                        productionId: production.productionId,
                        productionNavigationId: production.id,
                        isRejected,
                        approvalId: approval.id,
                        quantityForApproval: deductQty
                    });

                    price += stock.price * deductQty;
                }
                await models.ProductionRawMaterials.update(
                    {
                        issuedQuantity: Number((element.issuedQuantity || 0)) + Number((element.issuedToday || 0)),
                        currentAverage: (element.currentAverage || 0) + price
                    },
                    {
                        where: { id: element.id }
                    }
                );
                await models.ProductionHistory.create({
                    productionId: element?.productionId,
                    actionType: 'Raw Material Issued',
                    summary: `${element?.itemName} - ${element?.issuedToday} ${uomMap[element.uom]} issued by ${by} from ${element.store?.replaceAll("-fromrejectstore", "")} store.`
                });
            }
            else {
                stockTransferPayloads.push({
                    transferNumber: generateTransferNumber(),
                    fromStoreId: store.id,
                    itemId: item.id,
                    quantity: null,
                    toStoreId: null,
                    transferDate: new Date().toISOString(),
                    transferredBy: userId,
                    companyId,
                    price: 0,
                    productionId: production.productionId,
                    productionNavigationId: production.id,
                    isRejected,
                    approvalId: approval.id,
                    quantityForApproval: element.issuedToday * (element?.conversionFactor || 1)
                });
                await models.ProductionHistory.create({
                    productionId: element?.productionId,
                    actionType: 'Raw Material Issue Request.',
                    summary: `${element?.itemName} - ${element?.issuedToday} ${uomMap[element.uom]} requested by ${by}.`
                });
            }
        }
        if (stockTransferPayloads.length > 0) {
            await models.StockTransfer.bulkCreate(stockTransferPayloads);
        }
        return res.status(200).json({ message: settings?.['productionRawMaterial'] != 'manual' ? 'Material Issued.' : 'Raw materials are sent for store approval' });
    } catch (error) {
        console.error("Issue Error:", error);
        return res.status(500).json({
            message: "Failed to issue raw material.",
            error: error.message,
        });
    }
}

async function updateProcess(req, res) {
    try {
        const { processData, by } = req.body;
        const production = await models.Production.findOne({
            where: { id: processData?.[0]?.productionId }
        });
        if (!production) {
            return res.status(404).json({ message: 'Production not found.' });
        }
        await production.update({
            status: 2, ...(production.productionStartDate
                ? {}
                : { productionStartDate: new Date().toISOString() })
        });
        for (const element of processData) {
            if ((element.currentTime && element.amount)) {
                const process = await models.ProductionSalesProcess.findOne({ where: { id: element.id } });
                const [days, hours, miniutes, seconds] = element.currentTime.split(":").map(Number);
                const totalMinutes = ((((days || 0) * 24) + hours) * 60) + miniutes + ((seconds || 0) / 60);
                let totalCost = ((totalMinutes / 60) * element.amount);
                let currentAverageTime = '';
                if (!process.currentPlannedTime) {
                    currentAverageTime = element.currentTime;
                }
                else {
                    const parseTime = (timeStr) => {
                        if (!timeStr) return [0, 0, 0, 0];
                        const parts = timeStr.split(":").map(Number);
                        if (parts.length === 4) return parts;
                        if (parts.length === 3) return [0, ...parts];
                        return [0, 0, 0, 0];
                    };
                    const [d1, h1, m1, s1] = parseTime(process.currentPlannedTime);
                    const [d2, h2, m2, s2] = parseTime(element.currentTime);
                    let seconds = s1 + s2;
                    let minutes = m1 + m2 + Math.floor(seconds / 60);
                    let hours = h1 + h2 + Math.floor(minutes / 60);
                    let days = d1 + d2 + Math.floor(hours / 24);
                    seconds = seconds % 60;
                    minutes = minutes % 60;
                    hours = hours % 24;
                    const format = (num) => String(num).padStart(2, "0");
                    currentAverageTime = `${format(days)}:${format(hours)}:${format(minutes)}:${format(seconds)}`;
                }
                await models.ProductionSalesProcess.update({ currentaverageCost: (process.currentaverageCost || 0) + totalCost, currentPlannedTime: currentAverageTime }, {
                    where: {
                        id: element.id,
                    }
                });

            }
            if (Number(element.todayProcessQuantity)) {
                await models.ProductionSalesProcess.update({ processCompleteOn: (element.processCompleteOn || 0) + Number(element.todayProcessQuantity) }, {
                    where: {
                        id: element.id,
                    }
                });
                await models.ProductionHistory.create({
                    productionId: element?.productionId,
                    actionType: 'Process Logged',
                    summary: `${element.todayProcessQuantity} Process Logged under ${element.processName} by ${by}. Total time recorded ${element?.currentTime || element?.currentPlannedTime} at ₹${element.amount || element?.currentAverage} /hour cost.`
                });
            }
        }
        return res.status(200).json({ message: 'Process Updated' });
    } catch (error) {
        console.error("Issue Error:", error);
        return res.status(500).json({
            message: "Failed to issue raw material.",
            error: error.message,
        });
    }
}

async function updateCost(req, res) {
    try {
        const { additionalChargesData, by } = req.body;
        const production = await models.Production.findOne({
            where: { id: additionalChargesData[0]?.productionId }
        });
        if (!production) {
            return res.status(404).json({ message: 'Production not found.' });
        }
        await production.update({
            status: 2, ...(production.productionStartDate
                ? {}
                : { productionStartDate: new Date().toISOString() })
        });
        for (const element of additionalChargesData) {
            if (!element.todayCost) continue;
            const charges = await models.ProductionAdditionalCharges.findOne({
                where: {
                    id: element.id
                }
            });
            await models.ProductionAdditionalCharges.update({ currentCost: (charges.currentCost || 0) + element.todayCost }, {
                where: {
                    id: element.id
                }
            });

            await models.ProductionHistory.create({
                productionId: element.productionId,
                actionType: 'Additional Charges Added',
                summary: `${element?.chargesName} charge : ₹${element?.todayCost} added by ${by}`
            });
        }
        return res.status(200).json({ message: 'Process Updated' });
    } catch (error) {
        console.error("Issue Error:", error);
        return res.status(500).json({
            message: "Failed to issue raw material.",
            error: error.message,
        });
    }
}

async function updateScrapLogs(req, res) {
    try {
        const { scrapLogs, companyId, userId, by } = req.body;
        const uoms = await models.UOM.findAll({
            where: {
                [Op.or]: [
                    { companyId: companyId, status: 1 },
                    { companyId: null, status: 0 }
                ]
            },
            raw: true
        });
        const uomMap = uoms.reduce((acc, curr) => {
            acc[curr.id] = curr.code;
            return acc;
        }, {});
        const production = await models.Production.findOne({
            where: {
                id: scrapLogs[0]?.productionId
            }
        });
        await production.update({
            status: 2, ...(production.productionStartDate
                ? {}
                : { productionStartDate: new Date().toISOString() })
        });
        const settings = isValidJSON(production?.isManual) || {}
        const approvalCount = await models.InventoryApproval.count({
            where: {
                companyId
            }
        });
        const approval = await models.InventoryApproval.create({
            approvalId: `INA${approvalCount + 1}`,
            documentType: 'Scrap Material',
            documentNumber: production.id,
            approvalStatus: settings?.['productionScrapMaterial'] == 'manual' ? 'Pending' : 'Auto Approved',
            requestedBy: userId,
            companyId: companyId,
            status: 1,
            approvedBy: null
        });
        for (const element of scrapLogs) {
            if (!element.value || !element.store) continue;
            const rawMaterial = await models.ProductionRawMaterials.findOne({
                where: {
                    itemId: element.itemId,
                    productionId: element.productionId
                }
            });
            settings?.['productionScrapMaterial'] != 'manual' &&
                await models.ProductionScrapMaterials.update({ producedQuantity: (element?.producedQuantity || 0) + element.value }, {
                    where: {
                        id: element.id
                    }
                });
            settings?.['productionScrapMaterial'] != 'manual' &&
                await models.ProductionHistory.create({
                    productionId: element.productionId,
                    actionType: 'Scrap Material Produced.',
                    summary: `${element.itemName} - ${element.value} ${uomMap[element.uom]} added in ${element.store?.replaceAll("-fromrejectstore", "")} store by ${by}.`
                });
            const store = await models.Store.findOne({
                where: {
                    companyId: Number(companyId),
                    name: element.store?.replaceAll("-fromrejectstore", "")
                }
            });

            const item = await models.Items.findOne({
                where: {
                    companyId: Number(companyId),
                    itemId: element.itemId
                }
            });

            await models.StoreItems.create({
                storeId: store.id,
                itemId: item.id,
                quantity: settings?.['productionScrapMaterial'] == 'manual' ? 0 : (element.value * (element?.conversionFactor || 1)),
                status: 1,
                addedBy: Number(companyId),
                price: !rawMaterial ? (item?.price || 0) : 0,
                isRejected: element?.isReject || false,
                approvalId: approval.id,
                quantityForApproval: element.value * (element?.conversionFactor || 1)
            });

            await models.StockTransfer.create({
                transferNumber: generateTransferNumber(),
                fromStoreId: null,
                itemId: item.id,
                quantity: settings?.['productionScrapMaterial'] == 'manual' ? null : (element.value * (element?.conversionFactor || 1)),
                toStoreId: store.id,
                transferDate: new Date().toISOString(),
                transferredBy: Number(companyId),
                companyId: Number(companyId),
                price: !rawMaterial ? (item?.price || 0) : 0,
                productionId: production.productionId,
                productionNavigationId: production.id,
                isRejected: element?.isReject || false,
                approvalId: approval.id,
                quantityForApproval: element.value * (element?.conversionFactor || 1)
            });

        }
        return res.status(200).json({ message: settings?.['productionScrapMaterial'] == 'manual' ? 'Approval request send.' : 'Scrap Log Updated.' });
    } catch (error) {
        console.error("Issue Error:", error);
        return res.status(500).json({
            message: "Failed to update scrap log.",
            error: error.message,
        });
    }
}

async function saveFinishedGoods(req, res) {
    const transaction = await models.sequelize.transaction();

    try {
        const {
            process,
            rawMaterials,
            additionalCharges,
            store,
            rejectStore,
            finishedGoods,
            passedQty,
            rejectQty,
            companyId,
            batchData,
            userId,
            by,
            rejectQuantityCostPerUnit
        } = req.body;

        const uoms = await models.UOM.findAll({
            where: {
                [Op.or]: [
                    { companyId: companyId, status: 1 },
                    { companyId: null, status: 0 }
                ]
            },
            raw: true
        });
        const uomMap = uoms.reduce((acc, curr) => {
            acc[curr.id] = curr.code;
            return acc;
        }, {});

        const production = await models.Production.findOne({
            where: {
                id: finishedGoods[0]?.productionId
            }
        });

        const settings = isValidJSON(production?.isManual) || {}
        const approvalCount = await models.InventoryApproval.count({
            where: {
                companyId
            }
        });
        const approval = await models.InventoryApproval.create({
            approvalId: `INA${approvalCount + 1}`,
            documentType: 'Finished Good',
            documentNumber: production.id,
            approvalStatus: settings?.['productionFinishedGood'] == 'manual' ? 'Pending' : 'Auto Approved',
            requestedBy: userId,
            companyId: companyId,
            status: 1,
            approvedBy: null
        });

        let total = 0;

        process.forEach(data => {
            total += data.currentaverageCost || 0;
        });

        rawMaterials.forEach((data) => {
            total += (data.currentAverage || 0);
        });

        additionalCharges.forEach((data) => {
            total += data.currentCost || 0;
        });

        const item = await models.Items.findOne({
            where: {
                companyId,
                itemId: finishedGoods[0]?.itemId
            },
            transaction
        });

        const costPerUnit = total / (passedQty || 1);

        const stores = await models.Store.findOne({
            where: {
                companyId,
                name: store
            },
            transaction
        });

        const rejectStores = await models.Store.findOne({
            where: {
                companyId,
                name: rejectStore
            },
            transaction
        });

        await models.StoreItems.create({
            storeId: stores.id,
            itemId: item.id,
            quantity: settings?.['productionFinishedGood'] == 'manual' ? 0 : (passedQty * (finishedGoods[0]?.conversionFactor || 1)),
            status: 1,
            addedBy: companyId,
            price: costPerUnit,
            approvalId: approval.id,
            quantityForApproval: passedQty * (finishedGoods[0]?.conversionFactor || 1)
        }, { transaction });

        await models.StockTransfer.create({
            transferNumber: generateTransferNumber(),
            fromStoreId: null,
            itemId: item.id,
            quantity: settings?.['productionFinishedGood'] == 'manual' ? null : (passedQty * (finishedGoods[0]?.conversionFactor || 1)),
            toStoreId: stores.id,
            transferDate: new Date().toISOString(),
            transferredBy: companyId,
            companyId,
            price: costPerUnit,
            productionId: production.productionId,
            productionNavigationId: production.id,
            approvalId: approval.id,
            quantityForApproval: passedQty * (finishedGoods[0]?.conversionFactor || 1)
        }, { transaction });

        await models.ProductionHistory.create({
            productionId: production?.id,
            actionType: 'Finished Good Tested.',
            summary: `${finishedGoods[0]?.itemName} - ${passedQty} ${uomMap[finishedGoods[0]?.uom]} passed by ${by}.`
        });


        if (rejectQty) {
            await models.ProductionHistory.create({
                productionId: production?.id,
                actionType: 'Finished Good Tested.',
                summary: `${finishedGoods[0]?.itemName} - ${rejectQty} ${uomMap[finishedGoods[0]?.uom]} rejected by ${by}.`
            });
            await models.StoreItems.create({
                storeId: rejectStores.id,
                itemId: item.id,
                quantity: settings?.['productionFinishedGood'] == 'manual' ? 0 : (rejectQty * (finishedGoods[0]?.conversionFactor || 1)),
                status: 1,
                addedBy: companyId,
                price: rejectQuantityCostPerUnit || 0,
                isRejected: true,
                approvalId: approval.id,
                quantityForApproval: rejectQty * (finishedGoods[0]?.conversionFactor || 1)
            }, { transaction });

            await models.StockTransfer.create({
                transferNumber: generateTransferNumber(),
                fromStoreId: null,
                itemId: item.id,
                quantity: settings?.['productionFinishedGood'] == 'manual' ? null : (rejectQty * (finishedGoods[0]?.conversionFactor || 1)),
                toStoreId: rejectStores.id,
                transferDate: new Date().toISOString(),
                transferredBy: companyId,
                companyId,
                price: rejectQuantityCostPerUnit || 0,
                isRejected: true,
                productionId: production.productionId,
                productionNavigationId: production.id,
                approvalId: approval.id,
                quantityForApproval: rejectQty * (finishedGoods[0]?.conversionFactor || 1)
            }, { transaction });
        }

        await models.ProductionFinishedGoods.update({
            passedQuantity: (finishedGoods[0]?.passedQuantity || 0) + (settings?.['productionFinishedGood'] == 'manual' ? 0 : passedQty),
            rejectQuantity: (finishedGoods[0]?.rejectQuantity || 0) + (settings?.['productionFinishedGood'] == 'manual' ? 0 : (rejectQty || 0)),
            cost: (finishedGoods[0]?.cost || 0) + total,
            quantityToTest: 0
        }, {
            where: {
                id: finishedGoods[0].id
            },
            transaction
        });

        const finishedGood = await models.ProductionFinishedGoods.findOne({
            where: {
                id: finishedGoods[0].id
            }
        });
        if (finishedGood?.passedQuantity >= finishedGood?.quantity) {
            await production.update({
                status: 4, ...(production.productionCompletionDate
                    ? {}
                    : { productionCompletionDate: new Date().toISOString() })
            });
        }

        for (const element of additionalCharges) {
            await models.ProductionAdditionalCharges.update({
                currentCost: 0,
                totalCost: (element.totalCost || 0) + element.currentCost
            }, {
                where: { id: element.id },
                transaction
            });
        }

        for (const element of process) {
            const [d1, h1, m1, s1] = (element?.currentPlannedTime || '00:00:00:00').split(":").map(Number);
            const [d2, h2, m2, s2] = (element?.totalPlannedTime || '00:00:00:00').split(":").map(Number);

            let seconds = s1 + s2;
            let minutes = m1 + m2 + Math.floor(seconds / 60);
            let hours = h1 + h2 + Math.floor(minutes / 60);
            let days = d1 + d2 + Math.floor(hours / 24);

            seconds = seconds % 60;
            minutes = minutes % 60;
            hours = hours % 24;

            const format = (num) => String(num).padStart(2, '0');
            const totalPlannedTime = `${format(days)}:${format(hours)}:${format(minutes)}:${format(seconds)}`;

            await models.ProductionSalesProcess.update({
                currentPlannedTime: '00:00:00:00',
                totalPlannedTime,
                currentaverageCost: 0,
                averageCost: (element.averageCost || 0) + element.currentaverageCost
            }, {
                where: { id: element.id },
                transaction
            });
        }

        for (const element of rawMaterials) {
            const avgPrice = (element.averagePrice || 0) + (element.currentAverage || 0);
            await models.ProductionRawMaterials.update({
                currentAverage: 0,
                consumedQuantity: (element.consumedQuantity || 0) + element.issuedQuantity,
                issuedQuantity: 0,
                averagePrice: avgPrice
            }, {
                where: { id: element.id },
                transaction
            });
        }

        await transaction.commit();

        const goods = await models.ProductionFinishedGoods.findByPk(finishedGoods[0].id);
        if (goods && goods.quantity <= goods.passedQuantity) {
            await production.update({ status: 4 });
        }

        if (batchData && Array.isArray(batchData) && batchData?.length) {
            const batchItems = [];
            for (const element of batchData) {
                for (const batch of element.batchItems) {
                    batchItems.push({
                        companyId: Number(companyId),
                        createdBy: Number(companyId),
                        documentNumber: production?.productionId,
                        documentType: 'Production',
                        item: batch.item,
                        iterationCount: batch?.iterationCount,
                        barCodeNumber: batch?.barCodeNumber,
                        manufacturingDate: batch.manufacturingDate,
                        expiryDate: batch.expiryDate,
                        quantity: batch.quantity,
                        outQuantity: 0,
                        store: batch?.isRejected ? rejectStores.name : stores.name,
                        status: 1,
                        isRejected: batch?.isRejected || false
                    });
                }
            }
            if (batchItems.length) {
                await models.BatchItems.bulkCreate(batchItems);
            }
        }
        return res.status(200).json({ message: settings?.['productionFinishedGood'] == 'manual' ? 'Finished Goods Saved and Inventory approval Requested.' : 'Finished Goods Saved.' });

    } catch (error) {
        await transaction.rollback();
        console.error("Transaction Error:", error);
        return res.status(500).json({
            message: "Failed to save finished goods.",
            error: error.message,
        });
    }
}

async function updateProductionStatus(req, res) {
    const { productionId, status, userId, from, to, by, isBulkProduction } = req.body;
    try {
        if (isBulkProduction) {
            await models.BulkProduction.update({ status }, {
                where: {
                    id: productionId
                }
            });
            await models.Production.update({
                status
            }, {
                where: {
                    bulkProductionId: productionId
                }
            });
            return res.status(200).json({ message: 'Production status Updated.' });
        }
        await models.Production.update({
            status, ...(status == 2 ? { productionStartDate: new Date().toISOString() } : {}),
            ...(status == 4 ? { productionCompletionDate: new Date().toISOString(), completedBy: Number(userId) } : {})
        }, {
            where: {
                id: productionId
            }
        });
        await models.ProductionHistory.create({
            productionId,
            actionType: 'Production Stage changed',
            summary: `Stage change from ${from} to ${to} by ${by}`
        });
        return res.status(200).json({ message: 'Production status Updated.' });

    } catch (error) {
        console.error("Transaction Error:", error);
        return res.status(500).json({
            message: "Failed to Update Production.",
        });
    }
}

async function saveProduction(req, res) {
    const { finishedGoods, by, companyId } = req.body;
    try {
        const uoms = await models.UOM.findAll({
            where: {
                [Op.or]: [
                    { companyId: companyId, status: 1 },
                    { companyId: null, status: 0 }
                ]
            },
            raw: true
        });
        const uomMap = uoms.reduce((acc, curr) => {
            acc[curr.id] = curr.code;
            return acc;
        }, {});
        for (const element of finishedGoods) {
            if (!element.todaysProduction) continue;
            const finishedGood = await models.ProductionFinishedGoods.findOne({
                where: {
                    id: element.id
                }
            });

            await models.ProductionFinishedGoods.update({
                producedQuantity: (finishedGood.producedQuantity || 0) + element.todaysProduction,
                quantityToTest: (finishedGood.quantityToTest || 0) + element.todaysProduction

            }, {
                where: {
                    id: element.id
                }
            });

            await models.ProductionHistory.create({
                productionId: element?.productionId,
                actionType: 'Finished Goods Produced.',
                summary: `${element?.itemName} - ${element?.todaysProduction} ${uomMap[element.uom]} produced by ${by}.`
            });

        }
        res.status(200).json({ message: 'Production Updated.' });

    } catch (error) {
        console.error("Transaction Error:", error);
        return res.status(500).json({
            message: "Failed to Update Production.",
        });
    }
}

async function materialPlanning(req, res) {
    try {
        const { companyId, items } = req.body;
        const itemIds = items.map(item => item.itemId);

        // Fetch all items for the company and map by itemId
        const allItems = await models.Items.findAll({
            where: { companyId: Number(companyId) },
            raw: true,
        });
        const allItemsMap = Object.fromEntries(allItems.map(item => [item.itemId, item]));

        // Map of required quantities from request
        const requiredItemsMap = Object.fromEntries(items.map(item => [item.itemId, item.quantity]));

        // Fetch all BOM finished goods for itemIds
        const bomFinishedGoods = await models.BOMFinishedGoods.findAll({
            where: {
                itemId: {
                    [Op.in]: itemIds
                },
                companyId: Number(companyId)
            },
            raw: true,
        });

        // Get latest BOM by itemId (assuming sorted by createdAt)
        const latestBomFinishedGoods = {};
        bomFinishedGoods.forEach(bom => {
            if ((!latestBomFinishedGoods[bom.itemId] || new Date(bom.createdAt) > new Date(latestBomFinishedGoods[bom.itemId].createdAt)) && bom.uom == allItemsMap[bom.itemId]?.metricsUnit) {
                latestBomFinishedGoods[bom.itemId] = bom;
            }
        });

        const latestBomFinishedGoodsIds = Object.values(latestBomFinishedGoods).map(bom => bom.bomId);

        const bomIdToItemIdMap = Object.fromEntries(
            Object.values(latestBomFinishedGoods).map(bom => [bom.bomId, bom.itemId])
        );

        // Fetch BOM raw materials for latest BOMs
        const bomRawMaterials = await models.BOMRawMaterial.findAll({
            where: { bomId: latestBomFinishedGoodsIds },
            raw: true,
        });

        // Map BOM raw materials by itemId (finished goods itemId)
        const bomRawMaterialsMap = {};
        for (const material of bomRawMaterials) {
            const itemId = bomIdToItemIdMap[material.bomId];
            if (!bomRawMaterialsMap[itemId]) bomRawMaterialsMap[itemId] = [];
            bomRawMaterialsMap[itemId].push(material);
        }

        // Calculate required raw material quantities
        const requiredRawMaterials = {};
        for (const finishedItemId in latestBomFinishedGoods) {
            const finishedBom = latestBomFinishedGoods[finishedItemId];
            const rawMaterials = bomRawMaterialsMap[finishedItemId] || [];
            const requiredQty = requiredItemsMap[finishedItemId];
            for (const material of rawMaterials) {
                const qtyPerUnit = material.quantity / finishedBom.quantity;
                requiredRawMaterials[material.itemId] = (requiredRawMaterials[material.itemId] || 0) + (requiredQty * qtyPerUnit);
            }
        }

        // Get distinct raw material items
        const rawMaterialItems = Array.from(new Set(bomRawMaterials.map(material => material.itemId)))
            .map(itemId => allItemsMap[itemId])
            .filter(Boolean);

        const itemsPid = rawMaterialItems.map(item => item.id);
        const itemsPidMap = Object.fromEntries(rawMaterialItems.map(item => [item.id, item]));

        // Fetch store stock
        const storeItems = await models.StoreItems.findAll({
            where: {
                itemId: itemsPid,
                isRejected: false,
            },
            raw: true,
        });

        // Calculate current stock
        const currentStockMap = {};
        for (const storeItem of storeItems) {
            const rawItemId = itemsPidMap[storeItem.itemId]?.itemId;
            if (!rawItemId) continue;
            if (storeItem.quantity > 0) {
                currentStockMap[rawItemId] = (currentStockMap[rawItemId] || 0) + storeItem.quantity;
            }
        }

        const productions = await models.Production.findAll({
            where: {
                companyId: Number(companyId),
                documentNumber: {
                    [Op.notIn]: items.map(item => item.documentNumber)
                }
            },
            raw: true
        });

        const productionIds = productions.map(pro => pro.id);

        const productionRawMaterials = await models.ProductionRawMaterials.findAll({
            where: {
                productionId: productionIds
            },
            raw: true
        });

        const rawMaterialQueueMap = productionRawMaterials?.reduce((acc, curr) => {
            acc[curr.itemId] = (acc[curr.itemId] || 0) + Math.max((curr.quantity - ((curr.consumedQuantity || 0) + (curr.issuedQuantity || 0))), 0);
            return acc;
        }, {});

        const purchaseOrders = await models.Documents.findAll({
            where: {
                documentType: documentTypes.purchaseOrder,
                companyId: Number(companyId),
                status: {
                    [Op.in]: [1, 4]
                }
            },
            raw: true
        });

        const purchaseOrdersNumber = purchaseOrders.map(po => po.documentNumber);
        const grns = await models.Documents.findAll({
            where: {
                companyId: Number(companyId),
                documentType: documentTypes.goodsReceive,
                purchaseOrderNumber: purchaseOrdersNumber
            },
            raw: true
        });

        const latestGrnsMap = {};
        for (const element of grns) {
            latestGrnsMap[element.purchaseOrderNumber] = element;
        }

        const grnNumbers = Object.values(latestGrnsMap)?.map(grn => grn.documentNumber);
        const documentItems = await models.DocumentItems.findAll({
            where: {
                companyId: Number(companyId),
                documentNumber: grnNumbers
            }
        });

        const purchaseQuantityInQueue = documentItems?.reduce((acc, curr) => {
            acc[curr.itemId] = (acc?.[curr.itemId] || 0) + Math.max(((curr.pendingQuantity || 0) * (curr?.conversionFactor || 1)), 0);
            return acc;
        }, {});


        // Prepare final material planning output
        const mergedMap = {}
        bomRawMaterials.forEach(material => {
            const itemId = material.itemId;

            if (!mergedMap[itemId]) {
                mergedMap[itemId] = {
                    ...material,
                    requiredQty: requiredRawMaterials[itemId] || 0,
                    minStock: allItemsMap[itemId]?.minStock || 0,
                    currentStock: currentStockMap[itemId] || 0,
                    wip: rawMaterialQueueMap[itemId] || 0,
                    poQuantityInQueue: purchaseQuantityInQueue[itemId] || 0
                };
            } else {
                // Merge logic for duplicate itemId
                // mergedMap[itemId].requiredQty += requiredRawMaterials[itemId] || 0;
            }
        });

        const finalArray = Object.values(mergedMap);

        return res.status(200).json({ materialPlanningData: finalArray });
    } catch (error) {
        console.error("Transaction Error:", error);
        return res.status(500).json({
            message: "Failed to Get Material Planning Production.",
        });
    }
}

async function bomBasedMaterialPlanning(req, res) {
    try {
        const { companyId, data } = req.body;
        const bomDetails = await models.BOMDetails.findOne({
            where: { id: data.bomId }
        });

        const bomFinishedGoods = await models.BOMFinishedGoods.findOne({
            where: { bomId: data.bomId },
            raw: true
        });
        const bomRawMaterial = await models.BOMRawMaterial.findAll({
            where: {
                bomId: data.bomId
            },
            raw: true
        });

        const items = await models.Items.findAll({
            where: {
                companyId: Number(companyId),
                itemId: bomRawMaterial.map(data => data.itemId)
            },
            raw: true
        });

        const itemIds = items.map(item => item.id);
        const alternateunits = await models.AlternateUnits.findAll({
            where: {
                itemId: {
                    [Op.in]: itemIds
                }
            },
            raw: true
        });

        const itemMap = items.reduce((acc, curr) => {
            acc[curr.itemId] = curr;
            return acc;
        }, {});

        const requiredQtyMap = {};
        for (const element of bomRawMaterial) {
            let conversionFactor = 1;
            for (const au of alternateunits) {
                if (au.alternateUnits == element.uom && au.itemId == itemMap[element.itemId]?.id) {
                    conversionFactor = au.conversionfactor;
                    break;
                }
            }
            const perUnitQtyRequired = (element.quantity * conversionFactor) / bomFinishedGoods.quantity;
            requiredQtyMap[element.itemId] = data.quantity * perUnitQtyRequired;
        }



        const itemToPIdMap = items?.reduce((acc, curr) => {
            acc[curr.id] = curr.itemId;
            return acc;
        }, {});

        const storeItems = await models.StoreItems.findAll({
            where: {
                itemId: itemIds,
                isRejected: false,
            },
            raw: true,
        });

        const availableStockMap = storeItems?.reduce((acc, curr) => {
            if (curr.quantity > 0) acc[itemToPIdMap[curr.itemId]] = (acc[itemToPIdMap[curr.itemId]] ?? 0) + curr.quantity;
            return acc;
        }, {});

        const productions = await models.Production.findAll({
            where: {
                companyId: Number(companyId)
            }
        });

        const productionIds = productions.map(prod => prod.id);
        const productionRawmaterials = await models.ProductionRawMaterials.findAll({
            where: {
                productionId: productionIds,
                itemId: Object.keys(itemMap)
            }
        });

        const rawMaterialQueueMap = productionRawmaterials?.reduce((acc, curr) => {
            acc[curr.itemId] = (acc[curr.itemId] || 0) + Math.max(((curr.quantity * (curr?.conversionFactor || 1)) - (((curr.consumedQuantity * (curr?.conversionFactor || 1)) || 0) + ((curr.issuedQuantity * (curr?.conversionFactor || 1)) || 0))), 0);
            return acc;
        }, {});

        const purchaseOrders = await models.Documents.findAll({
            where: {
                documentType: documentTypes.purchaseOrder,
                companyId: Number(companyId),
                status: {
                    [Op.in]: [1, 4]
                }
            },
            raw: true
        });

        const purchaseOrdersNumber = purchaseOrders.map(po => po.documentNumber);
        const grns = await models.Documents.findAll({
            where: {
                companyId: Number(companyId),
                documentType: documentTypes.goodsReceive,
                purchaseOrderNumber: purchaseOrdersNumber
            },
            raw: true
        });

        const latestGrnsMap = {};
        for (const element of grns) {
            latestGrnsMap[element.purchaseOrderNumber] = element;
        }

        const grnNumbers = Object.values(latestGrnsMap)?.map(grn => grn.documentNumber);
        const documentItems = await models.DocumentItems.findAll({
            where: {
                companyId: Number(companyId),
                documentNumber: grnNumbers
            }
        });

        const purchaseQuantityInQueue = documentItems?.reduce((acc, curr) => {
            acc[curr.itemId] = (acc?.[curr.itemId] || 0) + Math.max(((curr.pendingQuantity || 0) * (curr?.conversionFactor || 1)), 0);
            return acc;
        }, {});

        const finalArray = bomRawMaterial.map(material => ({
            ...material,
            requiredQty: requiredQtyMap[material.itemId] || 0,
            minStock: itemMap[material.itemId]?.minStock || 0,
            currentStock: availableStockMap[material.itemId] || 0,
            wip: rawMaterialQueueMap[material.itemId] || 0,
            poQuantityInQueue: purchaseQuantityInQueue[material.itemId] || 0
        }));
        return res.status(200).json({ materialPlanningData: finalArray });
    } catch (error) {
        console.error("Transaction Error:", error);
        return res.status(500).json({
            message: "Failed to Get Material Planning Production.",
        });
    }
}

async function getProductionsByCompanyId(req, res) {
    try {
        const { companyId } = req.body;
        const productions = await models.Production.findAll({
            where: {
                companyId: Number(companyId)
            },
            raw: true
        });
        res.status(200).json({ productions });
    } catch (error) {
        console.error("Transaction Error:", error);
        return res.status(500).json({
            message: "Failed to Get Material Planning Production.",
        });
    }
}

async function productionBasedMaterialPlanning(req, res) {
    try {
        const { companyId, productionsIds } = req.body;


        const productionRawMaterials = await models.ProductionRawMaterials.findAll({
            where: { productionId: productionsIds },
            raw: true
        });


        const requiredQtyMap = {};
        for (const element of productionRawMaterials) {
            requiredQtyMap[element.itemId] = (requiredQtyMap[element.itemId] || 0) + Math.max(((element.quantity * (element?.conversionFactor || 1)) - ((element.issuedQuantity * (element?.conversionFactor || 1)) + (element.consumedQuantity * (element?.conversionFactor || 1)))));
        }

        const items = await models.Items.findAll({
            where: {
                companyId: Number(companyId),
                itemId: Object.keys(requiredQtyMap)
            },
            raw: true
        });

        const itemIds = items.map(item => item.id);

        const itemMap = items.reduce((acc, curr) => {
            acc[curr.itemId] = curr;
            return acc;
        }, {});

        const itemToPIdMap = items?.reduce((acc, curr) => {
            acc[curr.id] = curr.itemId;
            return acc;
        }, {});

        const storeItems = await models.StoreItems.findAll({
            where: {
                itemId: itemIds,
                isRejected: false,
            },
            raw: true,
        });

        const availableStockMap = storeItems?.reduce((acc, curr) => {
            if (curr.quantity > 0) acc[itemToPIdMap[curr.itemId]] = (acc[itemToPIdMap[curr.itemId]] ?? 0) + curr.quantity;
            return acc;
        }, {});

        const productions = await models.Production.findAll({
            where: {
                companyId: Number(companyId)
            }
        });

        const productionIds = productions?.filter(prod => !productionsIds?.includes(prod.id)).map(prod => prod.id);
        const productionRawmaterials = await models.ProductionRawMaterials.findAll({
            where: {
                productionId: productionIds,
                itemId: Object.keys(itemMap)
            }
        });

        const rawMaterialQueueMap = productionRawmaterials?.reduce((acc, curr) => {
            acc[curr.itemId] = (acc[curr.itemId] || 0) + Math.max(((curr.quantity * (curr?.conversionFactor || 1)) - (((curr.consumedQuantity * (curr?.conversionFactor || 1)) || 0) + ((curr.issuedQuantity * (curr?.conversionFactor || 1)) || 0))), 0);
            return acc;
        }, {});

        const purchaseOrders = await models.Documents.findAll({
            where: {
                documentType: documentTypes.purchaseOrder,
                companyId: Number(companyId),
                status: {
                    [Op.in]: [1, 4]
                }
            },
            raw: true
        });

        const purchaseOrdersNumber = purchaseOrders.map(po => po.documentNumber);
        const grns = await models.Documents.findAll({
            where: {
                companyId: Number(companyId),
                documentType: documentTypes.goodsReceive,
                purchaseOrderNumber: purchaseOrdersNumber
            },
            raw: true
        });

        const latestGrnsMap = {};
        for (const element of grns) {
            latestGrnsMap[element.purchaseOrderNumber] = element;
        }

        const grnNumbers = Object.values(latestGrnsMap)?.map(grn => grn.documentNumber);
        const documentItems = await models.DocumentItems.findAll({
            where: {
                companyId: Number(companyId),
                documentNumber: grnNumbers
            }
        });

        const purchaseQuantityInQueue = documentItems?.reduce((acc, curr) => {
            acc[curr.itemId] = (acc?.[curr.itemId] || 0) + Math.max(((curr.pendingQuantity || 0) * (curr?.conversionFactor || 1)), 0);
            return acc;
        }, {});

        const mergedMap = {};

        productionRawMaterials.forEach(material => {
            const itemId = material.itemId;

            if (!mergedMap[itemId]) {
                mergedMap[itemId] = {
                    ...material,
                    requiredQty: requiredQtyMap[itemId] || 0,
                    minStock: itemMap[itemId]?.minStock || 0,
                    currentStock: availableStockMap[itemId] || 0,
                    wip: rawMaterialQueueMap[itemId] || 0,
                    poQuantityInQueue: purchaseQuantityInQueue[itemId] || 0
                };
            } else {
                // If already exists, just accumulate requiredQty
                mergedMap[itemId].requiredQty += requiredQtyMap[itemId] || 0;
            }
        });

        const finalArray = Object.values(mergedMap);
        return res.status(200).json({ materialPlanningData: finalArray });
    } catch (error) {
        console.error("Transaction Error:", error);
        return res.status(500).json({
            message: "Failed to Get Material Planning Production.",
        });
    }
}

async function updateTable(req, res) {
    try {
        const { data, updateTableType, by, companyId } = req.body;

        const insertData = [], logs = [];
        const uoms = await models.UOM.findAll({
            where: {
                [Op.or]: [
                    { companyId: req.body.companyId, status: 1 },
                    { companyId: null, status: 0 }
                ]
            }
        });

        const uomMap = uoms.reduce((acc, curr) => {
            acc[curr.id] = curr.name;
            return acc;
        })

        if (!Array.isArray(data) || data.length === 0) {
            return res.status(400).json({ message: 'Invalid or empty data array.' });
        }

        switch (updateTableType) {
            case 'Raw Material':
                data.forEach(element => {
                    insertData.push({
                        productionId: element.productionId,
                        itemId: element.itemId,
                        itemName: element.itemName,
                        store: element.store,
                        uom: element.uom,
                        quantity: element.plannedQty,
                        status: 1,
                        addDuringProduction: true
                    });
                    logs.push({
                        productionId: element.productionId,
                        actionType: `New Raw Material added to the ${element?.store || 'unknown'} Store`,
                        summary: `${element.itemName} - ${element.plannedQty} ${uomMap?.[element.uom]}. Added by ${by}`
                    });
                });
                await models.ProductionRawMaterials.bulkCreate(insertData);
                await models.ProductionHistory.bulkCreate(logs);
                break;

            case 'Left Over Item':
                data.forEach(element => {
                    insertData.push({
                        productionId: element.productionId,
                        itemId: element.itemId,
                        itemName: element.itemName,
                        store: element.store,
                        uom: element.uom,
                        quantity: element.plannedQty,
                        status: 1
                    });
                    logs.push({
                        productionId: element.productionId,
                        actionType: `New Scrap Material added to the ${element?.store || 'unknown'} Store`,
                        summary: `${element.itemName} - ${element.plannedQty} ${uomMap?.[element.uom]}. Added by ${by}`
                    });
                });
                await models.ProductionScrapMaterials.bulkCreate(insertData);
                await models.ProductionHistory.bulkCreate(logs);
                break;

            case 'Additional Charges':
                data.forEach(element => {
                    insertData.push({
                        productionId: element.productionId,
                        chargesName: element.chargesName,
                        amount: element.amount,
                        status: 1
                    });
                    logs.push({
                        productionId: element.productionId,
                        actionType: `New Additional Charegs Added.`,
                        summary: `${element.chargesName} - ${element.amount}. Added by ${by}`
                    });
                });
                await models.ProductionAdditionalCharges.bulkCreate(insertData);
                await models.ProductionHistory.bulkCreate(logs);
                break;

            case 'Process':
                data.forEach(element => {
                    const [h, m, s] = element.plannedTime.split(':').map(Number);
                    const totalHours = h + m / 60 + s / 3600;
                    const cost = totalHours * Number(element.amount || 0);
                    insertData.push({
                        productionId: element.productionId,
                        cost,
                        plannedTime: element.plannedTime,
                        description: element.description,
                        processName: element.processName,
                        status: 1
                    });
                    logs.push({
                        productionId: element.productionId,
                        actionType: `New Process Added.`,
                        summary: `${element.processName} - ${element.plannedTime}. Added by ${by}.`
                    });
                });
                await models.ProductionSalesProcess.bulkCreate(insertData);
                await models.ProductionHistory.bulkCreate(logs);
                break;

            default:
                return res.status(400).json({ message: 'Invalid updateTableType' });
        }

        res.status(200).json({ message: 'Table Updated' });

    } catch (error) {
        console.error("Update Table Error:", error);
        res.status(500).json({
            message: "Failed to update production data.",
            error: error.message
        });
    }
}

async function removeRows(req, res) {
    try {
        const { id, type, by, name, productionId } = req.body;
        if (type == 'rawMaterial') {
            await models.ProductionRawMaterials.destroy({
                where: {
                    id
                }
            });
            await models.ProductionHistory.create({
                productionId,
                actionType: `Raw Material removed.`,
                summary: `Item Name: ${name}, removed By ${by}.`
            });
        } else if (type == 'process') {
            await models.ProductionSalesProcess.destroy({
                where: {
                    id
                }
            });
            await models.ProductionHistory.create({
                productionId,
                actionType: `Process removed.`,
                summary: `Process Name: ${name}, removed By ${by}.`
            });
        } else if (type == 'leftOver') {
            await models.ProductionScrapMaterials.destroy({
                where: {
                    id
                }
            });
            await models.ProductionHistory.create({
                productionId,
                actionType: `Scrap Material removed.`,
                summary: `Item Name: ${name}, removed By ${by}.`
            });
        }
        else if (type == 'additionalCharges') {
            await models.ProductionAdditionalCharges.destroy({
                where: {
                    id
                }
            });
            await models.ProductionHistory.create({
                productionId,
                actionType: `Additional Charges removed.`,
                summary: `Charges Name: ${name}, removed By ${by}.`
            });
        }
        res.status(200).json({
            message: 'Row removed Successfully'
        });
    } catch (error) {
        console.error("Update Table Error:", error);
        res.status(500).json({
            message: "Failed to update production data.",
            error: error.message
        });
    }
}

async function viewProductionHistory(req, res) {
    try {
        const { productionId } = req.body;
        const data = await models.ProductionHistory.findAll({
            where: {
                productionId
            },
            raw: true,
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json({
            data: data
        });
    } catch (error) {
        console.error("Update Table Error:", error);
        res.status(500).json({
            message: "Failed to fetch history",
            error: error.message
        });
    }
}

async function returnRawMaterial(req, res) {
    try {
        const { data, navigationId, productionId, by, companyId, userId } = req.body;
        const uoms = await models.UOM.findAll({
            where: {
                [Op.or]: [
                    { companyId: companyId, status: 1 },
                    { companyId: null, status: 0 }
                ]
            },
            raw: true
        });
        const uomMap = uoms.reduce((acc, curr) => {
            acc[curr.id] = curr.code;
            return acc;
        }, {});
        const items = await models.Items.findAll({
            where: {
                itemId: {
                    [Op.in]: data.map(row => row.itemId)
                }
            },
            raw: true
        });
        const itemMap = items.reduce((acc, curr) => {
            acc[curr.itemId] = curr;
            return acc;
        }, {});
        const production = await models.Production.findByPk(navigationId);
        const settings = isValidJSON(production?.isManual) || {}
        const approvalCount = await models.InventoryApproval.count({
            where: {
                companyId
            }
        });
        const approval = await models.InventoryApproval.create({
            approvalId: `INA${approvalCount + 1}`,
            documentType: 'Raw Material Return',
            documentNumber: production.id,
            approvalStatus: settings?.['productionRawMaterial'] == 'manual' ? 'Pending' : 'Auto Approved',
            requestedBy: userId,
            companyId: companyId,
            status: 1,
            approvedBy: null
        });

        for (const element of data) {
            if (!element.returnQuantity || element.returnQuantity == 0 || isNaN(element.returnQuantity))
                continue;
            let remainingQuantity = Number(element.returnQuantity) * (element.conversionFactor || 1);
            const stockTransfer = await models.StockTransfer.findAll({
                where: {
                    itemId: itemMap[element.itemId]?.id,
                    productionId,
                    quantity: {
                        [Op.lt]: 0
                    }
                },
                order: [['createdAt', 'ASC']]
            });

            for (const transfer of stockTransfer) {
                if (remainingQuantity <= 0) break;
                const deductQty = Math.min(transfer.quantity * -1, remainingQuantity);
                remainingQuantity -= deductQty;
                await models.StoreItems.create({
                    storeId: transfer.fromStoreId,
                    itemId: transfer.itemId,
                    quantity: settings?.['productionRawMaterial'] == 'manual' ? 0 : deductQty,
                    status: 1,
                    addedBy: Number(userId),
                    price: transfer.price,
                    isRejected: transfer?.isReject || false,
                    approvalId: approval.id,
                    quantityForApproval: Number(element.returnQuantity)
                });

                await models.StockTransfer.create({
                    transferNumber: generateTransferNumber(),
                    fromStoreId: null,
                    itemId: transfer.itemId,
                    quantity: settings?.['productionRawMaterial'] == 'manual' ? null : deductQty,
                    toStoreId: transfer.fromStoreId,
                    transferDate: new Date().toISOString(),
                    transferredBy: Number(userId),
                    companyId: Number(companyId),
                    price: transfer.price,
                    productionId: production.productionId,
                    productionNavigationId: production.id,
                    isRejected: transfer?.isReject || false,
                    approvalId: approval.id,
                    quantityForApproval: Number(element.returnQuantity)
                });

            }
            await models.ProductionHistory.create({
                productionId: production?.id,
                actionType: settings?.['productionRawMaterial'] == 'manual' ? 'Raw material return request.' : 'Raw material returned.',
                summary: `${element?.itemName} - ${element?.returnQuantity} ${uomMap[element.uom]}, ${settings?.['productionRawMaterial'] == 'manual' ? 'requested' : 'returned'} by ${by}`
            });
            if (settings?.['productionRawMaterial'] != 'manual') {
                const rawmaterial = await models.ProductionRawMaterials.findByPk(element.id);
                await rawmaterial.update({ issuedQuantity: rawmaterial.issuedQuantity - element?.returnQuantity });
            }

        }
        res.status(200).json({ message: settings?.['productionRawMaterial'] != 'manual' ? 'Raw Material Returned.' : 'Raw material return request generated.' });

    } catch (error) {
        console.error("Update Table Error:", error);
        res.status(500).json({
            message: "Failed to return.",
            error: error.message
        });
    }
}

async function startBulkProduction(req, res) {
    try {
        const { companyId, productions, mto, prefix, nextNumber } = req.body;
        const settings = await models.Settings.findOne({
            where: {
                companyId: Number(companyId)
            },
            raw: true
        });

        const bulkProductionCount = await models.BulkProduction.count({
            where: {
                companyId
            }
        });

        const parentProduction = await models.BulkProduction.create({
            companyId,
            productionId: `BulkProduction-${bulkProductionCount + 1}`,
            status: 1
        })

        const bulkProduction = productions.map(production => ({
            companyId: Number(companyId),
            productionId: production?.productionId || generateProductionId(),
            documentNumber: production?.documentNumber,
            bomId: production.bomId,
            productionEndDate: production.productionEndDate,
            assignedTo: production.assignedTo,
            createdBy: Number(companyId),
            status: 1,
            mto: mto ?? 0,
            isManual: {
                productionFinishedGood: settings?.['productionFinishedGood'],
                productionScrapMaterial: settings?.['productionScrapMaterial'],
                productionRawMaterial: settings?.['productionRawMaterial']
            },
            bulkProductionId: parentProduction.id
        }));

        const bulkProductions = await models.Production.bulkCreate(bulkProduction);
        const bulkProductionItems = bulkProductions.map((production, index) => ({
            productionId: production.id,
            documentNumber: productions[index].documentNumber,
            itemId: productions[index].itemId,
            itemName: productions[index].itemName,
            UOM: productions[index].UOM,
            quantity: productions[index].quantity,
            status: 1
        }));
        await models.ProductionItems.bulkCreate(bulkProductionItems);

        let index = 0;
        for (const production of bulkProductions) {
            const [scrapLogs, rawMaterials, finishedGoods, productionProcess, additionalCharges] = await Promise.all([
                models.BOMScrapMaterial.findAll({ where: { bomId: production.bomId } }),
                models.BOMRawMaterial.findAll({ where: { bomId: production.bomId } }),
                models.BOMFinishedGoods.findAll({ where: { bomId: production.bomId } }),
                models.BOMProductionProcess.findAll({ where: { bomId: production.bomId } }),
                models.BOMAdditionalCharges.findAll({ where: { bomId: production.bomId } }),
            ]);

            const productionProcessId = productionProcess.map(data => data.processId);

            const process = await models.ProductionProcess.findAll({
                where: {
                    id: {
                        [Op.in]: productionProcessId
                    }
                }
            });

            const itemsId = [];
            scrapLogs.forEach((data) => itemsId.push(data.itemId));
            rawMaterials.forEach((data) => itemsId.push(data.itemId));
            finishedGoods.forEach((data) => itemsId.push(data.itemId));

            const items = await models.Items.findAll({
                where: {
                    itemId: {
                        [Op.in]: itemsId
                    },
                    companyId: Number(companyId)
                },
                raw: true
            });
            const itemsMap = items?.reduce((acc, curr) => {
                acc[curr.itemId] = curr;
                return acc;
            }, {});
            const ids = items?.map(item => item.id);
            const alternateUnits = await models.AlternateUnits.findAll({
                where: {
                    itemId: {
                        [Op.in]: ids
                    }
                }, raw: true
            });

            const bulkRawMaterial = rawMaterials?.filter(data => !data.parentId).map((data) => {
                const quantity = (data.quantity) / finishedGoods[0]?.quantity;
                let conversionFactor = 1;
                if (data.uom != itemsMap[data.itemId]?.metricsUnit) {
                    for (const element of alternateUnits) {
                        if (element.itemId == itemsMap[data.itemId]?.id && element.alternateUnits == data.uom) {
                            conversionFactor = element.conversionfactor;
                            break;
                        }
                    }
                }
                return {
                    productionId: production.id,
                    itemId: data.itemId,
                    itemName: data.itemName,
                    store: data.store,
                    uom: data.uom,
                    quantity: productions[index].quantity * quantity,
                    conversionFactor,
                    status: 1
                }
            });

            const bulkAdditionalCharges = additionalCharges?.filter(data => data.chargesName).map((data) => {
                const price = (data.amount) / finishedGoods[0]?.quantity;
                return {
                    productionId: production.id,
                    chargesName: data.chargesName,
                    amount: productions[index].quantity * price,
                    status: 1
                }
            });

            const bulkScrapMaterial = scrapLogs?.filter(data => data?.itemName).map((data) => {
                const quantity = (data.quantity) / finishedGoods[0]?.quantity;
                let conversionFactor = 1;
                if (data.uom != itemsMap[data.itemId]?.metricsUnit) {
                    for (const element of alternateUnits) {
                        if (element.itemId == itemsMap[data.itemId]?.id && element.alternateUnits == data.uom) {
                            conversionFactor = element.conversionfactor;
                            break;
                        }
                    }
                }
                return {
                    productionId: production.id,
                    itemId: data.itemId,
                    itemName: data.itemName,
                    uom: data.uom,
                    quantity: productions[index].quantity * quantity,
                    store: data.store,
                    costAllocationPercent: data.costAllocationPercent,
                    conversionFactor,
                    status: 1
                }
            });

            const bulkFinishedGoods = finishedGoods.map((data) => {
                let conversionFactor = 1;
                if (data.uom != itemsMap[data.itemId]?.metricsUnit) {
                    for (const element of alternateUnits) {
                        if (element.itemId == itemsMap[data.itemId]?.id && element.alternateUnits == data.uom) {
                            conversionFactor = element.conversionfactor;
                            break;
                        }
                    }
                }
                return {
                    productionId: production.id,
                    itemId: data.itemId,
                    itemName: data.itemName,
                    uom: data.uom,
                    quantity: productions[index].quantity,
                    store: data.store,
                    costAllocationPercent: data.costAllocationPercent,
                    conversionFactor,
                    status: 1
                }
            });

            const bulkProcess = process.map((data) => {

                const [days, hours, minutes, seconds] = !data?.plannedTime ? [0, 0, 0, 0] : data?.plannedTime?.split(":")?.map(Number);
                const totalMinutes = (((days * 24) + hours) * 60) + minutes;
                const miniute = (productions[index]?.quantity) * (totalMinutes / finishedGoods[0]?.quantity);
                const totalSeconds = (miniute * 60) + seconds;

                const day = Math.floor(totalSeconds / (24 * 3600));
                const remainingAfterDays = totalSeconds % (24 * 3600);

                const hour = Math.floor(remainingAfterDays / 3600);
                const minute = Math.floor((remainingAfterDays % 3600) / 60);
                const second = Math.floor(remainingAfterDays % 60) || 0;

                const timeString = `${String(day).padStart(2, '0')}:${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;

                return {
                    productionId: production.id,
                    cost: (miniute / data.cost) * 60,
                    plannedTime: timeString,
                    description: data.description,
                    processName: data.processName,
                    status: 1,
                    perHourCost: (data?.cost / totalMinutes) * 60
                }
            });

            await Promise.all([
                models.ProductionSalesProcess.bulkCreate(bulkProcess),
                models.ProductionRawMaterials.bulkCreate(bulkRawMaterial),
                models.ProductionScrapMaterials.bulkCreate(bulkScrapMaterial),
                models.ProductionFinishedGoods.bulkCreate(bulkFinishedGoods),
                models.ProductionAdditionalCharges.bulkCreate(bulkAdditionalCharges),
            ]);
            index++;
        }
        if (prefix && nextNumber) {
            await models.DocumentSeries.update(
                { nextNumber: nextNumber + 1 },
                {
                    where: {
                        companyId: Number(companyId),
                        DocType: 'Production',
                        prefix
                    }
                }
            );
        }

        res.status(201).json({ message: 'Production Created Successfully.', data: parentProduction });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong' });
        console.log(error);
    }
}

async function remainingProduction(req, res) {
    try {
        const { companyId, startDate, endDate } = req.body;
        let finalStartDate;
        let finalEndDate;

        if (startDate && endDate) {
            finalStartDate = new Date(startDate);
            finalEndDate = new Date(endDate);
            finalStartDate.setDate(finalStartDate.getDate() - 1);
            finalEndDate.setDate(finalEndDate.getDate() + 1);
        } else {
            finalEndDate = new Date();
            finalStartDate = new Date();
            finalStartDate.setDate(finalEndDate.getDate() - 7);
            finalStartDate.setDate(finalStartDate.getDate() - 1);
            finalEndDate.setDate(finalEndDate.getDate() + 1);
        }
        const productions = await models.Production.findAll({
            where: {
                companyId: Number(companyId),
                documentNumber: {
                    [Op.ne]: null
                },
                status: {
                    [Op.ne]: 0
                }
            }
        });
        const docMap = {};
        const finishedGoods = await models.ProductionFinishedGoods.findAll({
            where: {
                productionId: {
                    [Op.in]: productions.map(prod => {
                        docMap[prod.id] = prod.documentNumber;
                        return prod.id;
                    })
                }
            }
        });
        const finishedGoodsMap = finishedGoods.reduce((acc, curr) => {
            if (!acc[docMap[curr.productionId]]) {
                acc[docMap[curr.productionId]] = {};
            }
            acc[docMap[curr.productionId]][curr.itemId] = (acc[docMap[curr.productionId]]?.[curr.itemId] || 0) + curr.quantity;
            return acc;
        }, {});

        const documents = await models.Documents.findAll({
            where: {
                documentNumber: {
                    [Op.in]: Object.values(docMap)
                },
                companyId: Number(companyId),
                createdAt: {
                    [Op.between]: [finalStartDate, finalEndDate]
                }
            },
            attributes: ['id', 'documentNumber', 'requestedBy', 'deliveryDate'],
            raw: true
        });
        const documentMap = documents.reduce((acc, curr) => {
            acc[curr.documentNumber] = curr;
            return acc;
        }, {});
        const items = await models.DocumentItems.findAll({
            where: {
                documentNumber: {
                    [Op.in]: documents?.map(doc => doc.documentNumber)
                }
            },
            raw: true
        });
        const result = items.filter(item => {
            if (finishedGoodsMap?.[item.documentNumber]?.[item.itemId] >= item.quantity) {
                return false;
            }
            item.quantity = item.quantity - (finishedGoodsMap?.[item.documentNumber]?.[item.itemId] || 0);
            item.requestedBy = documentMap?.[item.documentNumber]?.requestedBy;
            item.deliveryDate = documentMap?.[item.documentNumber]?.deliveryDate;
            item.id = item.id + Math.random().toString(36).substring(2, 15);
            return true;
        });
        return res.status(200).json({ remainingProduction: result });
    } catch (error) {
        console.error('remainingProduction error:', error);
        return res.status(500).json({ message: 'Something went wrong', error: error.message || error });
    }
}

async function discardProduction(req, res) {
    try {
        const { id } = req.body;
        await models.Production.update(
            { status: 0 },
            {
                where: {
                    [Op.or]: [
                        { id: id },
                        { bulkProductionId: id }
                    ]
                }
            }
        );
        return res.status(200).json({ message: 'Production Discarded.' });
    } catch (error) {
        console.error("Issue Error:", error);
        return res.status(500).json({
            message: "Failed to Discard Production",
            error: error.message,
        });
    }
}

async function bulkIssue(req, res) {
    try {
        const { productionId, quantity, companyId,
            userId, auto, skip, finishedGoodStoreMap,
            rawMaterialStoreMap, scrapMaterialStoreMap } =
            req.body;
        let totalPrice = 0;
        const production = await models.Production.findByPk(productionId);
        await production.update({
            status: 2, ...(production.productionStartDate
                ? {}
                : { productionStartDate: new Date().toISOString() })
        });
        const [finishedGoods, rawMaterials, scraps, processes, charges] = await Promise.all([
            models.ProductionFinishedGoods.findAll({ where: { productionId } }),
            models.ProductionRawMaterials.findAll({ where: { productionId } }),
            models.ProductionScrapMaterials.findAll({ where: { productionId } }),
            models.ProductionSalesProcess.findAll({ where: { productionId } }),
            models.ProductionAdditionalCharges.findAll({ where: { productionId } }),
        ]);
        for (const element of charges) {
            const unit = element.amount / finishedGoods[0].quantity;
            auto && await element.update({ totalCost: (element.totalCost || 0) + (unit * quantity) });
            !auto && await element.update({ currentCost: (element.currentCost || 0) + (unit * quantity) });
            totalPrice += unit * quantity;
        }
        for (const element of processes) {
            const [dd, hh, mm, ss] = element?.plannedTime?.split(":").map(Number);
            const unit = (((dd || 0) * 86400 + (hh || 0) * 3600 + (mm || 0) * 60 + (ss || 0)) / finishedGoods[0].quantity) * quantity;
            const cost = (unit / 3600) * (element.perHourCost || 0);
            totalPrice += cost;
            const current = timeToSeconds(auto ? element.totalPlannedTime : element?.currentPlannedTime);
            const result = secondsToTime(unit + current);
            await element.update({ ...(auto ? { totalPlannedTime: result, averageCost: (element.averageCost || 0) + cost } : { currentPlannedTime: result, currentaverageCost: (element.currentaverageCost || 0) + cost }), processCompleteOn: (element.processCompleteOn || 0) + quantity });
        }
        for (const element of scraps) {
            const settings = isValidJSON(element?.isManual) || {};
            const approvalCount = await models.InventoryApproval.count({
                where: {
                    companyId
                }
            });
            const approval = await models.InventoryApproval.create({
                approvalId: `INA${approvalCount + 1}`,
                documentType: 'Scrap Material',
                documentNumber: production.id,
                approvalStatus: 'Auto Approved',
                requestedBy: userId,
                companyId: companyId,
                status: 1,
                approvedBy: null
            });
            const unit = element.quantity / finishedGoods[0].quantity;
            if (!element.store) continue;
            const rawMaterial = await models.ProductionRawMaterials.findOne({
                where: {
                    itemId: element.itemId,
                    productionId: element.productionId
                }
            });

            await models.ProductionScrapMaterials.update({ producedQuantity: (element?.producedQuantity || 0) + (unit * quantity) }, {
                where: {
                    id: element.id
                }
            });

            const store = await models.Store.findOne({
                where: {
                    companyId: Number(companyId),
                    name: scrapMaterialStoreMap?.[element.itemId]?.replaceAll("-fromrejectstore", "")
                }
            });

            const item = await models.Items.findOne({
                where: {
                    companyId: Number(companyId),
                    itemId: element.itemId
                }
            });

            await models.StoreItems.create({
                storeId: store.id,
                itemId: item.id,
                quantity: ((unit * quantity) * (element?.conversionFactor || 1)),
                status: 1,
                addedBy: Number(companyId),
                price: !rawMaterial ? (item?.price || 0) : 0,
                isRejected: element?.isReject || false,
                approvalId: approval.id,
                quantityForApproval: (unit * quantity) * (element?.conversionFactor || 1)
            });

            await models.StockTransfer.create({
                transferNumber: generateTransferNumber(),
                fromStoreId: null,
                itemId: item.id,
                quantity: ((unit * quantity) * (element?.conversionFactor || 1)),
                toStoreId: store.id,
                transferDate: new Date().toISOString(),
                transferredBy: Number(companyId),
                companyId: Number(companyId),
                price: !rawMaterial ? (item?.price || 0) : 0,
                productionId: production.productionId,
                productionNavigationId: production.id,
                isRejected: element?.isReject || false,
                approvalId: approval.id,
                quantityForApproval: (unit * quantity) * (element?.conversionFactor || 1)
            });

        }

        const [stores, items] = await Promise.all([
            models.Store.findAll({ where: { companyId: Number(companyId) } }),
            models.Items.findAll({
                where: {
                    companyId,
                    itemId: {
                        [Op.in]: rawMaterials.map(data => data.itemId)
                    }
                }
            })
        ]);
        const storeMap = new Map(stores.map(store => [store.name, store]));
        const itemMap = new Map(items.map(item => [item.itemId, item]));
        for (const element of rawMaterials) {
            if (skip?.includes(element.itemId)) continue;
            const unit = element.quantity / finishedGoods[0].quantity;
            if (!rawMaterialStoreMap[element.itemId]) continue;
            const settings = isValidJSON(production?.isManual) || {}
            const approvalCount = await models.InventoryApproval.count({
                where: {
                    companyId
                }
            });
            const approval = await models.InventoryApproval.create({
                approvalId: `INA${approvalCount + 1}`,
                documentType: 'Raw Material',
                documentNumber: production.id,
                approvalStatus: 'Auto Approved',
                requestedBy: userId,
                companyId: companyId,
                status: 1,
                approvedBy: null
            });

            const stockTransferPayloads = [];
            const storeName = rawMaterialStoreMap[element.itemId];
            const store = storeMap.get(storeName);
            const item = itemMap.get(element.itemId);
            if (!store || !item) continue;
            const isRejected = element?.isReject || false;
            const existingStock = await models.StoreItems.findAll({
                where: {
                    storeId: store.id,
                    itemId: item.id,
                    isRejected
                },
                order: [['createdAt', 'ASC']]
            });
            let price = 0;
            let remainingQuantity = (unit * quantity) * (element?.conversionFactor || 1);
            for (const stock of existingStock) {
                if (remainingQuantity <= 0) break;
                if (stock.quantity <= 0) continue;
                const deductQty = Math.min(stock.quantity, remainingQuantity);
                remainingQuantity -= deductQty;
                await stock.update({ quantity: stock.quantity - deductQty });
                stockTransferPayloads.push({
                    transferNumber: generateTransferNumber(),
                    fromStoreId: store.id,
                    itemId: item.id,
                    quantity: -deductQty,
                    toStoreId: null,
                    transferDate: new Date().toISOString(),
                    transferredBy: userId,
                    companyId,
                    price: stock.price,
                    productionId: production.productionId,
                    productionNavigationId: production.id,
                    isRejected,
                    approvalId: approval.id,
                    quantityForApproval: deductQty
                });

                price += stock.price * deductQty;
            }
            totalPrice += price;
            auto && await models.ProductionRawMaterials.update(
                {
                    consumedQuantity: Number((element.consumedQuantity || 0)) + Number(((unit * quantity) || 0)),
                    averagePrice: (element.averagePrice || 0) + price
                },
                {
                    where: { id: element.id }
                }
            );
            !auto && await models.ProductionRawMaterials.update(
                {
                    issuedQuantity: Number((element.issuedQuantity || 0)) + (unit * quantity),
                    currentAverage: (element.currentAverage || 0) + price
                },
                {
                    where: { id: element.id }
                }
            );

            if (stockTransferPayloads.length > 0) {
                await models.StockTransfer.bulkCreate(stockTransferPayloads);
            }
        }
        for (const element of finishedGoods) {
            console.log("totalPrice", totalPrice);
            if (!finishedGoodStoreMap?.[element.itemId]) continue;
            await element.update({ producedQuantity: (element.producedQuantity || 0) + quantity, ...(auto ? { passedQuantity: (element.passedQuantity || 0) + quantity, cost: (element.cost || 0) + totalPrice } : {}), ...(!auto ? { quantityToTest: (element.quantityToTest || 0) + quantity } : {}) });
            if (auto) {
                const approvalCount = await models.InventoryApproval.count({
                    where: {
                        companyId
                    }
                });
                const approval = await models.InventoryApproval.create({
                    approvalId: `INA${approvalCount + 1}`,
                    documentType: 'Finished Good',
                    documentNumber: production.id,
                    approvalStatus: 'Auto Approved',
                    requestedBy: userId,
                    companyId: companyId,
                    status: 1,
                    approvedBy: null
                });
                const item = await models.Items.findOne({ where: { companyId: Number(companyId), itemId: element.itemId } });
                const stores = storeMap.get(finishedGoodStoreMap[element.itemId]);
                const costPerUnit = totalPrice / quantity;

                await models.StoreItems.create({
                    storeId: stores.id,
                    itemId: item.id,
                    quantity: (quantity * (finishedGoods[0]?.conversionFactor || 1)),
                    status: 1,
                    addedBy: companyId,
                    price: costPerUnit,
                    approvalId: approval.id,
                    quantityForApproval: quantity * (finishedGoods[0]?.conversionFactor || 1)
                });

                await models.StockTransfer.create({
                    transferNumber: generateTransferNumber(),
                    fromStoreId: null,
                    itemId: item.id,
                    quantity: (quantity * (finishedGoods[0]?.conversionFactor || 1)),
                    toStoreId: stores.id,
                    transferDate: new Date().toISOString(),
                    transferredBy: companyId,
                    companyId,
                    price: costPerUnit,
                    productionId: production.productionId,
                    productionNavigationId: production.id,
                    approvalId: approval.id,
                    quantityForApproval: quantity * (finishedGoods[0]?.conversionFactor || 1)
                });
            }
            if (element.passedQuantity >= element.quantity) {
                await production.update({
                    status: 4, ...(production.productionCompletionDate
                        ? {}
                        : { productionCompletionDate: new Date().toISOString() })
                });
            }
        }

        await models.ProductionHistory.create({
            productionId,
            actionType: `Bulk Issue Requested.`,
            summary: `Bulk Issue Requested For ${quantity} Units.`
        });

        res.status(200).json({
            message: 'Bulk Issue Successfully.'
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Internal Server Error"
        });
    }
}

module.exports = {
    startProduction: startProduction,
    getProductions: getProductions,
    getProductionById: getProductionById,
    bulkGetProductionsByIds: bulkGetProductionsByIds,
    issueRawMaterial: issueRawMaterial,
    updateProcess: updateProcess,
    updateCost: updateCost,
    updateScrapLogs: updateScrapLogs,
    saveFinishedGoods: saveFinishedGoods,
    updateProductionStatus: updateProductionStatus,
    saveProduction: saveProduction,
    materialPlanning: materialPlanning,
    bomBasedMaterialPlanning: bomBasedMaterialPlanning,
    getProductionsByCompanyId: getProductionsByCompanyId,
    productionBasedMaterialPlanning: productionBasedMaterialPlanning,
    updateTable: updateTable,
    removeRows: removeRows,
    viewProductionHistory: viewProductionHistory,
    returnRawMaterial: returnRawMaterial,
    startBulkProduction: startBulkProduction,
    getBulkProductions: getBulkProductions,
    remainingProduction: remainingProduction,
    discardProduction: discardProduction,
    bulkIssue: bulkIssue
}