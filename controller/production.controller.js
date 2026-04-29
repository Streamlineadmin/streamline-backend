const { Op } = require('sequelize');
const { documentTypes } = require('../helpers/document-type');
const { generateProductionId, generateTransferNumber } = require('../helpers/transfer-number');
const models = require('../models');
const { buildMultiLevelProductionTree, isValidJSON, secondsToTime, timeToSeconds } = require('../helpers/add-level');

async function startProduction(req, res) {
    const tStart = await models.sequelize.transaction();
    try {
        const { companyId, productions, mto, prefix, nextNumber } = req.body;
        const settings = await models.Settings.findOne({
            where: {
                companyId: Number(companyId)
            },
            raw: true,
            transaction: tStart
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
        const bulkProductions = await models.Production.bulkCreate(bulkProduction, { transaction: tStart });
        const bulkProductionItems = bulkProductions.map((production, index) => ({
            productionId: production.id,
            documentNumber: productions[index].documentNumber,
            itemId: productions[index].itemId,
            itemName: productions[index].itemName,
            UOM: productions[index].UOM,
            quantity: productions[index].quantity,
            status: 1
        }));
        await models.ProductionItems.bulkCreate(bulkProductionItems, { transaction: tStart });
        let index = 0;
        for (const production of bulkProductions) {
            const [scrapLogs, rawMaterials, finishedGoods, productionProcess, additionalCharges] = await Promise.all([
                models.BOMScrapMaterial.findAll({ where: { bomId: production.bomId }, transaction: tStart }),
                models.BOMRawMaterial.findAll({ where: { bomId: production.bomId }, order: [["createdAt", "ASC"]], transaction: tStart }),
                models.BOMFinishedGoods.findAll({ where: { bomId: production.bomId }, transaction: tStart }),
                models.BOMProductionProcess.findAll({ where: { bomId: production.bomId }, transaction: tStart }),
                models.BOMAdditionalCharges.findAll({ where: { bomId: production.bomId }, transaction: tStart }),
            ]);

            const productionProcessId = productionProcess.map(data => data.processId);

            const process = await models.ProductionProcess.findAll({
                where: {
                    id: {
                        [Op.in]: productionProcessId
                    }
                },
                transaction: tStart
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
                raw: true,
                transaction: tStart
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
                },
                raw: true,
                transaction: tStart
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

            const quantMap = {};


            for (const element of rawMaterials) {
                if (!element.parentId) {
                    quantMap[element.id] = (element.quantity / finishedGoods[0].quantity) * productions[index].quantity
                }
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
                    }, { transaction: tStart });

                    const [scrapLogs, childFinishedGoods, productionProcess, additionalCharges, childRaws] = await Promise.all([
                        models.BOMScrapMaterial.findAll({ where: { bomId: element.finishedGoodBomId }, transaction: tStart }),
                        models.BOMFinishedGoods.findAll({ where: { bomId: element.finishedGoodBomId }, transaction: tStart }),
                        models.BOMProductionProcess.findAll({ where: { bomId: element.finishedGoodBomId }, transaction: tStart }),
                        models.BOMAdditionalCharges.findAll({ where: { bomId: element.finishedGoodBomId }, transaction: tStart }),
                        models.BOMRawMaterial.findAll({ where: { bomId: element.finishedGoodBomId }, transaction: tStart })
                    ]);

                    const childRawsMap = childRaws?.reduce((acc, curr) => {
                        acc[curr.itemId] = curr.quantity || 1;
                        return acc;
                    }, {});

                    const finishedGoodsQuantity = quantMap[element.id];
                    const productionProcessId = productionProcess.map(data => data.processId);
                    const process = await models.ProductionProcess.findAll({
                        where: {
                            id: {
                                [Op.in]: productionProcessId
                            }
                        },
                        transaction: tStart
                    });
                    const rawMaterial = childs[element.id];
                    const bulkRawMaterial = rawMaterial?.map((data) => {
                        const quantity = (childRawsMap?.[data.itemId] || 1) / childFinishedGoods[0]?.quantity;
                        let conversionFactor = 1;
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
                        models.ProductionSalesProcess.bulkCreate(bulkProcess, { transaction: tStart }),
                        models.ProductionRawMaterials.bulkCreate(bulkRawMaterial, { transaction: tStart }),
                        models.ProductionScrapMaterials.bulkCreate(bulkScrapMaterial, { transaction: tStart }),
                        models.ProductionFinishedGoods.bulkCreate(bulkFinishedGoods, { transaction: tStart }),
                        models.ProductionAdditionalCharges.bulkCreate(bulkAdditionalCharges, { transaction: tStart }),
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
                models.ProductionSalesProcess.bulkCreate(bulkProcess, { transaction: tStart }),
                models.ProductionRawMaterials.bulkCreate(bulkRawMaterial, { transaction: tStart }),
                models.ProductionScrapMaterials.bulkCreate(bulkScrapMaterial, { transaction: tStart }),
                models.ProductionFinishedGoods.bulkCreate(bulkFinishedGoods, { transaction: tStart }),
                models.ProductionAdditionalCharges.bulkCreate(bulkAdditionalCharges, { transaction: tStart }),
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
                    },
                    transaction: tStart
                }
            );
        }

        await tStart.commit();
        res.status(201).json({ message: 'Production Created Successfully.', productions: bulkProductions?.map(item => item.get({ plain: true })) });
    } catch (error) {
        await tStart.rollback();
        res.status(500).json({ message: 'Something went wrong' });
        console.log(error);
    }
}

async function getProductions(req, res) {
    try {
        const { companyId, endDate, startDate, isDiscard, status } = req.body;
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
                "purchaseOrderNumber",
                "buyerName"
            ],
        });
        const salesDocumentsId = salesDocuments.map(doc => doc.documentNumber);
        const productions = await models.Production.findAll({
            where: {
                companyId: Number(companyId),
                bulkProductionId: null,
                status: {
                    [Op.in]: isDiscard ? status : [1, 2, 3, 4]
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
            salesDocument.items = isDiscard ? [] : items;
        }
        const manualProductions = [];
        for (const element of productions) {
            if (!element.documentNumber || element.parentProductionId) {
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
        const { companyId, startDate, endDate, isDiscard, status } = req.body;
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
                },
                status: {
                    [Op.in]: isDiscard ? status : [1, 2, 3, 4]
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
        const scrapBatchItems = await models.BatchItems.findAll({
            where: {
                documentNumber: productionId,
                documentType: 'Scrap Material',
            },
            raw: true
        });
        const scrapItems = await models.Items.findAll({
            where: {
                id: {
                    [Op.in]: scrapBatchItems.map(item => item.item)
                }
            },
            raw: true,
            attributes: ['itemId', 'id']
        });
        const scrapItemsMap = scrapItems.reduce((acc, curr) => {
            acc[curr.id] = curr.itemId;
            return acc;
        }, {});
        const scrapBatchMap = scrapBatchItems.reduce((acc, current) => {
            if (acc[scrapItemsMap[current.item]]) {
                const obj = acc[scrapItemsMap[current.item]];
                acc[scrapItemsMap[current.item]] = [...obj, current];
            }
            else {
                acc[scrapItemsMap[current.item]] = [current];
            }
            return acc;
        }, {});
        const finishedBatchItems = await models.BatchItems.findAll({
            where: {
                documentNumber: productionId,
                documentType: 'Finished Good',
            },
            raw: true
        });
        const finishedItems = await models.Items.findAll({
            where: {
                id: {
                    [Op.in]: finishedBatchItems.map(item => item.item)
                }
            },
            raw: true,
            attributes: ['itemId', 'id']
        });
        const finishedItemsMap = finishedItems.reduce((acc, curr) => {
            acc[curr.id] = curr.itemId;
            return acc;
        }, {});
        const finishedBatchMap = finishedBatchItems.reduce((acc, current) => {
            if (acc[finishedItemsMap[current.item]]) {
                const obj = acc[finishedItemsMap[current.item]];
                acc[finishedItemsMap[current.item]] = [...obj, current];
            }
            else {
                acc[finishedItemsMap[current.item]] = [current];
            }
            return acc;
        }, {});
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

        const boms = await models.BOMDetails.findAll({
            where: {
                id: {
                    [Op.in]: multilevelProducions?.map(data => data.bomId)
                }
            },
            raw: true,
            attributes: ["bomName", "id", "bomId"]
        });

        const bomMap = boms?.reduce((acc, curr) => {
            acc[curr.id] = curr;
            return acc;
        }, {});

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
                    finishedGood: multiFinishedGoodsMap[data.id],
                    bomDetails: bomMap?.[data.bomId]
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
            item.batches = scrapBatchMap?.[item.itemId];
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
                finishedGoods: [{ ...finishedGoods[0]?.toJSON(), customFields, batches: finishedBatchMap?.[finishedGoods[0]?.itemId] }],
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
    const tIssue = await models.sequelize.transaction();
    try {
        const { rawMaterialData, companyId, userId, by } = req.body;
        const uoms = await models.UOM.findAll({
            where: {
                [Op.or]: [
                    { companyId: companyId, status: 1 },
                    { companyId: null, status: 0 }
                ]
            },
            raw: true,
            transaction: tIssue
        });
        const uomMap = uoms.reduce((acc, curr) => {
            acc[curr.id] = curr.code;
            return acc;
        }, {});
        if (!rawMaterialData || rawMaterialData.length === 0) {
            await tIssue.rollback();
            return res.status(400).json({ message: 'No raw material data provided.' });
        }
        const production = await models.Production.findOne({
            where: { id: rawMaterialData[0]?.productionId },
            transaction: tIssue
        });
        if (!production) {
            await tIssue.rollback();
            return res.status(404).json({ message: 'Production not found.' });
        }
        await production.update({
            status: 2, ...(production.productionStartDate
                ? {}
                : { productionStartDate: new Date().toISOString() })
        }, { transaction: tIssue });
        const settings = isValidJSON(production?.isManual) || {}
        const approvalCount = await models.InventoryApproval.count({
            where: {
                companyId
            },
            transaction: tIssue
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
        }, { transaction: tIssue });
        const [stores, items] = await Promise.all([
            models.Store.findAll({ where: { companyId: Number(companyId) }, transaction: tIssue }),
            models.Items.findAll({ where: { companyId }, transaction: tIssue })
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
                    order: [['createdAt', 'ASC']],
                    transaction: tIssue
                });
                let price = 0;
                let remainingQuantity = element.issuedToday * (element?.conversionFactor || 1);
                for (const stock of existingStock) {
                    if (remainingQuantity <= 0) break;
                    if (stock.quantity <= 0) continue;
                    const deductQty = Math.min(stock.quantity, remainingQuantity);
                    remainingQuantity -= deductQty;
                    await stock.update({ quantity: stock.quantity - deductQty }, { transaction: tIssue });
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
                        where: { id: element.id },
                        transaction: tIssue
                    }
                );
                await models.ProductionHistory.create({
                    productionId: element?.productionId,
                    actionType: 'Raw Material Issued',
                    summary: `${element?.itemName} - ${element?.issuedToday} ${uomMap[element.uom]} issued by ${by} from ${element.store?.replaceAll("-fromrejectstore", "")} store.`
                }, { transaction: tIssue });
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
                }, { transaction: tIssue });
            }
        }
        if (stockTransferPayloads.length > 0) {
            await models.StockTransfer.bulkCreate(stockTransferPayloads, { transaction: tIssue });
        }
        await tIssue.commit();
        return res.status(200).json({ message: settings?.['productionRawMaterial'] != 'manual' ? 'Material Issued.' : 'Raw materials are sent for store approval' });
    } catch (error) {
        await tIssue.rollback();
        console.error("Issue Error:", error);
        return res.status(500).json({
            message: "Failed to issue.",
            error: error.message
        });
    }
}

async function updateProcess(req, res) {
    const tUpdateProcess = await models.sequelize.transaction();
    try {
        const { processData, by, userId } = req.body;
        const production = await models.Production.findOne({
            where: { id: processData?.[0]?.productionId },
            transaction: tUpdateProcess
        });
        if (!production) {
            await tUpdateProcess.rollback();
            return res.status(404).json({ message: 'Production not found.' });
        }
        await production.update({
            status: 2, ...(production.productionStartDate
                ? {}
                : { productionStartDate: new Date().toISOString() })
        }, { transaction: tUpdateProcess });

        for (const element of processData) {
            if ((element.currentTime && element.amount)) {
                const process = await models.ProductionSalesProcess.findOne({
                    where: { id: element.id },
                    transaction: tUpdateProcess
                });
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
                    },
                    transaction: tUpdateProcess
                });

            }
            if (Number(element.todayProcessQuantity)) {
                await models.ProductionSalesProcess.update({ processCompleteOn: (element.processCompleteOn || 0) + Number(element.todayProcessQuantity) }, {
                    where: {
                        id: element.id,
                    },
                    transaction: tUpdateProcess
                });
                await models.ProductionHistory.create({
                    productionId: element?.productionId,
                    actionType: 'Process Logged',
                    summary: `${element.todayProcessQuantity} Process Logged under ${element.processName} by ${by}. Total time recorded ${element?.currentTime || element?.currentPlannedTime} at ₹${element.amount || element?.currentAverage} /hour cost.`
                }, {
                    transaction: tUpdateProcess
                });
                await models.ProcessLogs.create({
                    companyId: production.companyId,
                    productionId: production.id,
                    processId: element.id,
                    quantity: element.todayProcessQuantity,
                    userId
                }, {
                    transaction: tUpdateProcess
                });
            }
            element?.remark && await models.ProductionHistory.create({
                productionId: element?.productionId,
                actionType: 'comments',
                summary: `${element.remark}. Remarked by ${by}.`
            }, {
                transaction: tUpdateProcess
            });
        }
        await tUpdateProcess.commit();
        return res.status(200).json({ message: 'Process Updated' });
    } catch (error) {
        await tUpdateProcess.rollback();
        console.error("Issue Error:", error);
        return res.status(500).json({
            message: "Failed to issue raw material.",
            error: error.message,
        });
    }
}

async function updateCost(req, res) {
    const tUpdateCost = await models.sequelize.transaction();
    try {
        const { additionalChargesData, by } = req.body;
        const production = await models.Production.findOne({
            where: { id: additionalChargesData[0]?.productionId },
            transaction: tUpdateCost
        });
        if (!production) {
            await tUpdateCost.rollback();
            return res.status(404).json({ message: 'Production not found.' });
        }
        await production.update({
            status: 2, ...(production.productionStartDate
                ? {}
                : { productionStartDate: new Date().toISOString() })
        }, { transaction: tUpdateCost });
        for (const element of additionalChargesData) {
            if (!element.todayCost) continue;
            const charges = await models.ProductionAdditionalCharges.findOne({
                where: {
                    id: element.id
                },
                transaction: tUpdateCost
            });
            await models.ProductionAdditionalCharges.update({ currentCost: (charges.currentCost || 0) + element.todayCost }, {
                where: {
                    id: element.id
                },
                transaction: tUpdateCost
            });

            await models.ProductionHistory.create({
                productionId: element.productionId,
                actionType: 'Additional Charges Added',
                summary: `${element?.chargesName} charge : ₹${element?.todayCost} added by ${by}`
            }, { transaction: tUpdateCost });
        }
        await tUpdateCost.commit();
        return res.status(200).json({ message: 'Process Updated' });
    } catch (error) {
        await tUpdateCost.rollback();
        console.error("Issue Error:", error);
        return res.status(500).json({
            message: "Failed to issue raw material.",
            error: error.message,
        });
    }
}

async function updateScrapLogs(req, res) {
    const tUpdateScrap = await models.sequelize.transaction();
    try {
        const { scrapLogs, companyId, userId, by } = req.body;
        const uoms = await models.UOM.findAll({
            where: {
                [Op.or]: [
                    { companyId: companyId, status: 1 },
                    { companyId: null, status: 0 }
                ]
            },
            raw: true,
            transaction: tUpdateScrap
        });
        const uomMap = uoms.reduce((acc, curr) => {
            acc[curr.id] = curr.code;
            return acc;
        }, {});
        const production = await models.Production.findOne({
            where: {
                id: scrapLogs[0]?.productionId
            },
            transaction: tUpdateScrap
        });
        await production.update({
            status: 2, ...(production.productionStartDate
                ? {}
                : { productionStartDate: new Date().toISOString() })
        }, { transaction: tUpdateScrap });
        const settings = isValidJSON(production?.isManual) || {}
        const approvalCount = await models.InventoryApproval.count({
            where: {
                companyId
            },
            transaction: tUpdateScrap
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
        }, { transaction: tUpdateScrap });
        for (const element of scrapLogs) {
            if (!element.value || !element.store) continue;
            const rawMaterial = await models.ProductionRawMaterials.findOne({
                where: {
                    itemId: element.itemId,
                    productionId: element.productionId
                },
                transaction: tUpdateScrap
            });
            if (settings?.['productionScrapMaterial'] != 'manual') {
                await models.ProductionScrapMaterials.update({ producedQuantity: (element?.producedQuantity || 0) + element.value }, {
                    where: {
                        id: element.id
                    },
                    transaction: tUpdateScrap
                });
                await models.ProductionHistory.create({
                    productionId: element.productionId,
                    actionType: 'Scrap Material Produced.',
                    summary: `${element.itemName} - ${element.value} ${uomMap[element.uom]} added in ${element.store?.replaceAll("-fromrejectstore", "")} store by ${by}.`
                }, { transaction: tUpdateScrap });
            }
            const store = await models.Store.findOne({
                where: {
                    companyId: Number(companyId),
                    name: element.store?.replaceAll("-fromrejectstore", "")
                },
                transaction: tUpdateScrap
            });

            const item = await models.Items.findOne({
                where: {
                    companyId: Number(companyId),
                    itemId: element.itemId
                },
                transaction: tUpdateScrap
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
            }, { transaction: tUpdateScrap });

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
            }, { transaction: tUpdateScrap });

        }
        await tUpdateScrap.commit();
        return res.status(200).json({ message: settings?.['productionScrapMaterial'] == 'manual' ? 'Approval request send.' : 'Scrap Log Updated.' });
    } catch (error) {
        await tUpdateScrap.rollback();
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
            reworkQty,
            companyId,
            userId,
            by,
            rejectQuantityCostPerUnit,
            comments
        } = req.body;

        const uoms = await models.UOM.findAll({
            where: {
                [Op.or]: [
                    { companyId: companyId, status: 1 },
                    { companyId: null, status: 0 }
                ]
            },
            raw: true,
            transaction
        });
        const uomMap = uoms.reduce((acc, curr) => {
            acc[curr.id] = curr.code;
            return acc;
        }, {});

        const production = await models.Production.findOne({
            where: {
                id: finishedGoods[0]?.productionId
            },
            transaction
        });

        const settings = isValidJSON(production?.isManual) || {}
        const approvalCount = await models.InventoryApproval.count({
            where: {
                companyId
            },
            transaction
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
        }, { transaction });

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

        const costPerUnit = total / (Number(passedQty || 1) + Number(reworkQty || 0));

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
            transferredBy: userId,
            companyId,
            price: costPerUnit,
            productionId: production.productionId,
            productionNavigationId: production.id,
            approvalId: approval.id,
            quantityForApproval: passedQty * (finishedGoods[0]?.conversionFactor || 1),
            comment: comments || ''
        }, { transaction });

        await models.ProductionHistory.create({
            productionId: production?.id,
            actionType: 'Finished Good Tested.',
            summary: `${finishedGoods[0]?.itemName} - ${passedQty} ${uomMap[finishedGoods[0]?.uom]} passed by ${by}.`
        }, { transaction });


        if (rejectQty) {
            await models.ProductionHistory.create({
                productionId: production?.id,
                actionType: 'Finished Good Tested.',
                summary: `${finishedGoods[0]?.itemName} - ${rejectQty} ${uomMap[finishedGoods[0]?.uom]} rejected by ${by}.`
            }, { transaction });
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
                transferredBy: userId,
                companyId,
                price: rejectQuantityCostPerUnit || 0,
                isRejected: true,
                productionId: production.productionId,
                productionNavigationId: production.id,
                approvalId: approval.id,
                quantityForApproval: rejectQty * (finishedGoods[0]?.conversionFactor || 1),
                comment: comments || ''
            }, { transaction });
        }
        if (reworkQty) {
            await models.ProductionHistory.create({
                productionId: production?.id,
                actionType: 'Quantity Send for rework.',
                summary: `${finishedGoods[0]?.itemName} - ${reworkQty} ${uomMap[finishedGoods[0]?.uom]} send for rework by ${by}.`
            }, { transaction });
        }

        await models.ProductionFinishedGoods.update({
            passedQuantity: (finishedGoods[0]?.passedQuantity || 0) + (settings?.['productionFinishedGood'] == 'manual' ? 0 : passedQty),
            rejectQuantity: (finishedGoods[0]?.rejectQuantity || 0) + (settings?.['productionFinishedGood'] == 'manual' ? 0 : (rejectQty || 0)),
            cost: (finishedGoods[0]?.cost || 0) + total,
            quantityToTest: 0,
            pendingReworkQuantity: (finishedGoods[0]?.pendingReworkQuantity || 0) + (Number(reworkQty) || 0),
            reworkQuantityCost: (finishedGoods[0]?.reworkQuantityCost || 0) + (reworkQty ? (total / (Number(reworkQty || 0) + Number(passedQty || 0))) * (Number(reworkQty || 0)) : 0),
        }, {
            where: {
                id: finishedGoods[0].id
            },
            transaction
        });

        const finishedGood = await models.ProductionFinishedGoods.findOne({
            where: {
                id: finishedGoods[0].id
            },
            transaction
        });
        if (finishedGood?.passedQuantity >= finishedGood?.quantity) {
            await production.update({
                status: 4, ...(production.productionCompletionDate
                    ? {}
                    : { productionCompletionDate: new Date().toISOString() })
            }, { transaction });
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


        const goods = await models.ProductionFinishedGoods.findByPk(finishedGoods[0].id, { transaction });
        if (goods && goods.quantity <= goods.passedQuantity) {
            await production.update({ status: 4 }, { transaction });
        }

        await transaction.commit();

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
    const tUpdateStatus = await models.sequelize.transaction();
    try {
        if (isBulkProduction) {
            await models.BulkProduction.update({ status }, {
                where: {
                    id: productionId
                },
                transaction: tUpdateStatus
            });
            await models.Production.update({
                status
            }, {
                where: {
                    bulkProductionId: productionId
                },
                transaction: tUpdateStatus
            });
            await tUpdateStatus.commit();
            return res.status(200).json({ message: 'Production status Updated.' });
        }
        await models.Production.update({
            status, ...(status == 2 ? { productionStartDate: new Date().toISOString() } : {}),
            ...(status == 4 ? { productionCompletionDate: new Date().toISOString(), completedBy: Number(userId) } : {})
        }, {
            where: {
                id: productionId
            },
            transaction: tUpdateStatus
        });
        await models.ProductionHistory.create({
            productionId,
            actionType: 'Production Stage changed',
            summary: `Stage change from ${from} to ${to} by ${by}`
        }, {
            transaction: tUpdateStatus
        });

        await tUpdateStatus.commit();
        return res.status(200).json({ message: 'Production status Updated.' });

    } catch (error) {
        await tUpdateStatus.rollback();
        console.error("Transaction Error:", error);
        return res.status(500).json({
            message: "Failed to Update Production.",
        });
    }
}

async function saveProduction(req, res) {
    const tSaveProduction = await models.sequelize.transaction();
    try {
        const { finishedGoods, by, companyId } = req.body;
        const uoms = await models.UOM.findAll({
            where: {
                [Op.or]: [
                    { companyId: companyId, status: 1 },
                    { companyId: null, status: 0 }
                ]
            },
            raw: true,
            transaction: tSaveProduction
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
                },
                transaction: tSaveProduction
            });

            await models.ProductionFinishedGoods.update({
                producedQuantity: (finishedGood.producedQuantity || 0) + element.todaysProduction,
                quantityToTest: (finishedGood.quantityToTest || 0) + element.todaysProduction

            }, {
                where: {
                    id: element.id
                },
                transaction: tSaveProduction
            });

            await models.ProductionHistory.create({
                productionId: element?.productionId,
                actionType: 'Finished Goods Produced.',
                summary: `${element?.itemName} - ${element?.todaysProduction} ${uomMap[element.uom]} produced by ${by}.`
            }, { transaction: tSaveProduction });

        }
        await tSaveProduction.commit();
        res.status(200).json({ message: 'Production Updated.' });

    } catch (error) {
        await tSaveProduction.rollback();
        console.error("Transaction Error:", error);
        return res.status(500).json({
            message: "Failed to Update Production.",
        });
    }
}

async function materialPlanning(req, res) {
    try {
        const { companyId, items } = req.body;
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
            acc[curr.name] = curr.id;
            return acc;
        }, {});

        items.forEach((item) => {
            item.uom = uomMap?.[item.UOM]?.toString()
        });

        // 🔑 helper to uniquely identify item + uom
        const makeKey = (itemId, uom) => `${itemId}_${uom}`;

        /** ---------------------------
         * STEP 1: Normalize request items
         * itemId + uom treated separately
         * --------------------------- */
        const requiredItemsMap = {};
        const itemIds = [];

        items.forEach(item => {
            const key = makeKey(item.itemId, item.uom);
            requiredItemsMap[key] = (requiredItemsMap[key] || 0) + item.quantity;
            itemIds.push(item.itemId);
        });

        /** ---------------------------
         * STEP 2: Fetch all items
         * --------------------------- */
        const allItems = await models.Items.findAll({
            where: { companyId: Number(companyId) },
            raw: true,
        });

        const allItemsMap = Object.fromEntries(
            allItems.map(item => [item.itemId, item])
        );

        const selectedBomIds = items.map(i => i.selectedBOM.id).filter(Boolean);
        /** ---------------------------
         * STEP 3: Fetch BOM finished goods
         * --------------------------- */
        const bomFinishedGoods = await models.BOMFinishedGoods.findAll({
            where: {
                bomId: { [Op.in]: selectedBomIds },
                companyId: Number(companyId),
            },
            raw: true,
        });

        /** ---------------------------
         * STEP 4: Pick selected BOM per bomId
         * --------------------------- */
        const latestBomFinishedGoods = {};

        bomFinishedGoods.forEach(bom => {
            const key = makeKey(bom.itemId, bom.uom);

            latestBomFinishedGoods[key] = bom;
        });

        const latestBomIds = Object.values(latestBomFinishedGoods).map(
            bom => bom.bomId
        );

        const bomIdToItemKeyMap = Object.fromEntries(
            Object.values(latestBomFinishedGoods).map(bom => [
                bom.bomId,
                makeKey(bom.itemId, bom.uom),
            ])
        );

        /** ---------------------------
         * STEP 5: Fetch BOM raw materials
         * --------------------------- */
        const bomRawMaterials = await models.BOMRawMaterial.findAll({
            where: { bomId: latestBomIds },
            raw: true,
        });

        const existingItems = await models.Items.findAll({
            where: {
                companyId,
                itemId: {
                    [Op.in]: bomRawMaterials.map(bom => bom.itemId)
                }
            },
            raw: true,
            attributes: ['id', 'itemId', 'metricsUnit']
        });

        const itemMap = existingItems.reduce((acc, curr) => {
            acc[curr.id] = curr;
            return acc;
        }, {});
        const itemIdMap = existingItems.reduce((acc, curr) => {
            acc[curr.itemId] = curr;
            return acc;
        }, {});
        const alternateUnits = await models.AlternateUnits.findAll({
            where: {
                itemId: {
                    [Op.in]: existingItems.map(item => item.id)
                }
            },
            raw: true
        });

        const alternateUnitsMap = alternateUnits.reduce((acc, curr) => {
            if (acc[itemMap[curr.itemId].itemId]) {
                acc[itemMap[curr.itemId].itemId].push(curr);
            } else {
                acc[itemMap[curr.itemId].itemId] = [curr];
            }
            return acc;
        }, {});
        const bomRawMaterialsMap = {};
        bomRawMaterials.forEach(material => {
            const itemKey = bomIdToItemKeyMap[material.bomId];
            if (!bomRawMaterialsMap[itemKey]) bomRawMaterialsMap[itemKey] = [];
            bomRawMaterialsMap[itemKey].push(material);
        });

        /** ---------------------------
         * STEP 6: Calculate required raw materials
         * --------------------------- */
        const requiredRawMaterials = {};

        for (const finishedItemKey in latestBomFinishedGoods) {
            const finishedBom = latestBomFinishedGoods[finishedItemKey];
            const rawMaterials = bomRawMaterialsMap[finishedItemKey] || [];
            const requiredQty = requiredItemsMap[finishedItemKey] || 0;

            rawMaterials.forEach(material => {
                let conversionFactor = 1;
                if (itemIdMap[material.itemId]?.metricsUnit != material.uom) {
                    const altUnit = alternateUnitsMap?.[material.itemId].find((altu) => altu.alternateUnits == material.uom);
                    if (altUnit) {
                        conversionFactor = altUnit.conversionfactor;
                    }
                }
                const qtyPerUnit =
                    (material.quantity / finishedBom.quantity) *
                    (conversionFactor);

                requiredRawMaterials[material.itemId] =
                    (requiredRawMaterials[material.itemId] || 0) +
                    requiredQty * qtyPerUnit;
            });
        }

        /** ---------------------------
         * STEP 7: Fetch store stock
         * --------------------------- */
        const rawMaterialItemIds = [
            ...new Set(bomRawMaterials.map(m => m.itemId)),
        ];

        const rawItems = rawMaterialItemIds
            .map(id => allItemsMap[id])
            .filter(Boolean);

        const rawItemsPid = rawItems.map(i => i.id);
        const rawItemsPidMap = Object.fromEntries(
            rawItems.map(i => [i.id, i])
        );

        const storeItems = await models.StoreItems.findAll({
            where: {
                itemId: rawItemsPid,
                isRejected: false,
            },
            raw: true,
        });

        const currentStockMap = {};
        storeItems.forEach(storeItem => {
            const rawItemId = rawItemsPidMap[storeItem.itemId]?.itemId;
            if (!rawItemId) return;
            currentStockMap[rawItemId] =
                (currentStockMap[rawItemId] || 0) + storeItem.quantity;
        });

        /** ---------------------------
         * STEP 8: WIP (production queue)
         * --------------------------- */
        const productions = await models.Production.findAll({
            where: {
                companyId: Number(companyId),
                status: {
                    [Op.ne]: 0
                },
                documentNumber: {
                    [Op.notIn]: items.map(i => i.documentNumber),
                },
            },
            raw: true,
        });

        const productionIds = productions.map(p => p.id);

        const productionRawMaterials =
            await models.ProductionRawMaterials.findAll({
                where: { productionId: productionIds },
                raw: true,
            });

        const rawMaterialQueueMap = productionRawMaterials.reduce((acc, curr) => {
            acc[curr.itemId] =
                (acc[curr.itemId] || 0) +
                Math.max(
                    curr.quantity -
                    ((curr.consumedQuantity || 0) +
                        (curr.issuedQuantity || 0)),
                    0
                );
            return acc;
        }, {});

        /** ---------------------------
         * STEP 9: Purchase order queue
         * --------------------------- */
        const purchaseOrders = await models.Documents.findAll({
            where: {
                documentType: documentTypes.purchaseOrder,
                companyId: Number(companyId),
                status: { [Op.in]: [1, 4] },
            },
            raw: true,
        });

        const poNumbers = purchaseOrders.map(po => po.documentNumber);

        const grns = await models.Documents.findAll({
            where: {
                companyId: Number(companyId),
                documentType: documentTypes.goodsReceive,
                purchaseOrderNumber: poNumbers,
            },
            raw: true,
        });

        const latestGrnsMap = {};
        grns.forEach(grn => {
            latestGrnsMap[grn.purchaseOrderNumber] = grn;
        });

        const grnNumbers = Object.values(latestGrnsMap).map(
            g => g.documentNumber
        );

        const documentItems = await models.DocumentItems.findAll({
            where: {
                companyId: Number(companyId),
                documentNumber: grnNumbers,
            },
            raw: true,
        });

        const purchaseQuantityInQueue = documentItems.reduce((acc, curr) => {
            acc[curr.itemId] =
                (acc[curr.itemId] || 0) +
                Math.max(
                    (curr.pendingQuantity || 0) *
                    (curr.conversionFactor || 1),
                    0
                );
            return acc;
        }, {});

        /** ---------------------------
         * STEP 10: Final merge (NO UOM COLLISION)
         * --------------------------- */
        const mergedMap = {};

        bomRawMaterials.forEach(material => {
            const key = makeKey(material.itemId);

            if (!mergedMap[key]) {
                mergedMap[key] = {
                    ...material,
                    metricsUnit: allItemsMap[material.itemId]?.metricsUnit,
                    requiredQty: requiredRawMaterials[material.itemId] || 0,
                    minStock: allItemsMap[material.itemId]?.minStock || 0,
                    currentStock: currentStockMap[material.itemId] || 0,
                    wip: rawMaterialQueueMap[material.itemId] || 0,
                    poQuantityInQueue:
                        purchaseQuantityInQueue[material.itemId] || 0,
                };
            }
        });

        return res.status(200).json({
            materialPlanningData: Object.values(mergedMap),
        });
    } catch (error) {
        console.error("Material Planning Error:", error);
        return res.status(500).json({
            message: "Failed to Get Material Planning Production.",
        });
    }
}

async function bomBasedMaterialPlanning(req, res) {
    try {
        const { companyId, data } = req.body;
        const bomIds = data.map(d => d.bomId);

        const bomDetails = await models.BOMDetails.findAll({
            where: { id: bomIds },
            raw: true
        });

        const bomFinishedGoods = await models.BOMFinishedGoods.findAll({
            where: { bomId: bomIds },
            raw: true
        });

        const bomFinishedGoodsMap = bomFinishedGoods.reduce((acc, curr) => {
            acc[curr.bomId] = curr;
            return acc;
        }, {});

        const dataQuantityMap = data.reduce((acc, curr) => {
            acc[curr.bomId] = curr.quantity;
            return acc;
        }, {});

        const bomRawMaterial = await models.BOMRawMaterial.findAll({
            where: {
                bomId: bomIds
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
            const finishedGood = bomFinishedGoodsMap[element.bomId];
            if (!finishedGood) continue;
            const bomQuantity = dataQuantityMap[element.bomId] || 0;
            const perUnitQtyRequired = (element.quantity * conversionFactor) / finishedGood.quantity;
            requiredQtyMap[element.itemId] = (requiredQtyMap[element.itemId] || 0) + (bomQuantity * perUnitQtyRequired);
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
                companyId: Number(companyId),
                status: {
                    [Op.ne]: 0
                }
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

        const finalArray = [];
        const alreadyItemsMap = {};
        for (const material of bomRawMaterial) {
            if (alreadyItemsMap[material.itemId]) continue;
            alreadyItemsMap[material.itemId] = true;
            finalArray.push({
                ...material,
                metricsUnit: itemMap?.[material.itemId]?.metricsUnit,
                requiredQty: requiredQtyMap[material.itemId] || 0,
                minStock: itemMap[material.itemId]?.minStock || 0,
                currentStock: availableStockMap[material.itemId] || 0,
                wip: rawMaterialQueueMap[material.itemId] || 0,
                poQuantityInQueue: purchaseQuantityInQueue[material.itemId] || 0
            });
        }

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
                companyId: Number(companyId),
                status: {
                    [Op.ne]: 0
                }
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
                    metricsUnit: itemMap?.[material?.itemId]?.metricsUnit,
                    requiredQty: requiredQtyMap[itemId] || 0,
                    minStock: itemMap[itemId]?.minStock || 0,
                    currentStock: availableStockMap[itemId] || 0,
                    wip: rawMaterialQueueMap[itemId] || 0,
                    poQuantityInQueue: purchaseQuantityInQueue[itemId] || 0
                };
            } else {
                // If already exists, just accumulate requiredQty
                // mergedMap[itemId].requiredQty += requiredQtyMap[itemId] || 0;
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
    const tUpdateTable = await models.sequelize.transaction();
    try {
        const { data, updateTableType, by, companyId } = req.body;

        const insertData = [], logs = [];
        const uoms = await models.UOM.findAll({
            where: {
                [Op.or]: [
                    { companyId: req.body.companyId, status: 1 },
                    { companyId: null, status: 0 }
                ]
            },
            transaction: tUpdateTable
        });

        const uomMap = uoms.reduce((acc, curr) => {
            acc[curr.id] = curr.name;
            return acc;
        }, {});

        if (!Array.isArray(data) || data.length === 0) {
            await tUpdateTable.rollback();
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
                await models.ProductionRawMaterials.bulkCreate(insertData, { transaction: tUpdateTable });
                await models.ProductionHistory.bulkCreate(logs, { transaction: tUpdateTable });
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
                await models.ProductionScrapMaterials.bulkCreate(insertData, { transaction: tUpdateTable });
                await models.ProductionHistory.bulkCreate(logs, { transaction: tUpdateTable });
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
                await models.ProductionAdditionalCharges.bulkCreate(insertData, { transaction: tUpdateTable });
                await models.ProductionHistory.bulkCreate(logs, { transaction: tUpdateTable });
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
                await models.ProductionSalesProcess.bulkCreate(insertData, { transaction: tUpdateTable });
                await models.ProductionHistory.bulkCreate(logs, { transaction: tUpdateTable });
                break;

            default:
                await tUpdateTable.rollback();
                return res.status(400).json({ message: 'Invalid updateTableType' });
        }

        await tUpdateTable.commit();
        res.status(200).json({ message: 'Table Updated' });

    } catch (error) {
        await tUpdateTable.rollback();
        console.error("Update Table Error:", error);
        res.status(500).json({
            message: "Failed to update production data.",
            error: error.message
        });
    }
}

async function removeRows(req, res) {
    const tRemoveRows = await models.sequelize.transaction();
    try {
        const { id, type, by, name, productionId } = req.body;
        if (type == 'rawMaterial') {
            const rawMaterial = await models.ProductionRawMaterials.findByPk(id);
            if (rawMaterial) {
                const production = await models.Production.findByPk(productionId);
                if (production && production.bomId) {
                    const bomRawMaterial = await models.BOMRawMaterial.findOne({
                        where: { bomId: production.bomId, itemId: rawMaterial.itemId }
                    });

                    if (bomRawMaterial) {
                        const isParent = await models.BOMRawMaterial.findOne({
                            where: { parentId: bomRawMaterial.id }
                        });

                        if (isParent) {
                            await tRemoveRows.rollback();
                            return res.status(200).json({ message: "Available as Parent BOM" });
                        }
                    }
                }
            }

            await models.ProductionRawMaterials.destroy({
                where: {
                    id
                },
                transaction: tRemoveRows
            });
            await models.ProductionHistory.create({
                productionId,
                actionType: `Raw Material removed.`,
                summary: `Item Name: ${name}, removed By ${by}.`
            }, {
                transaction: tRemoveRows
            });
        } else if (type == 'process') {
            await models.ProductionSalesProcess.destroy({
                where: {
                    id
                },
                transaction: tRemoveRows
            });
            await models.ProductionHistory.create({
                productionId,
                actionType: `Process removed.`,
                summary: `Process Name: ${name}, removed By ${by}.`
            }, {
                transaction: tRemoveRows
            });
        } else if (type == 'leftOver') {
            await models.ProductionScrapMaterials.destroy({
                where: {
                    id
                },
                transaction: tRemoveRows
            });
            await models.ProductionHistory.create({
                productionId,
                actionType: `Scrap Material removed.`,
                summary: `Item Name: ${name}, removed By ${by}.`
            }, {
                transaction: tRemoveRows
            });
        }
        else if (type == 'additionalCharges') {
            await models.ProductionAdditionalCharges.destroy({
                where: {
                    id
                },
                transaction: tRemoveRows
            });
            await models.ProductionHistory.create({
                productionId,
                actionType: `Additional Charges removed.`,
                summary: `Charges Name: ${name}, removed By ${by}.`
            }, {
                transaction: tRemoveRows
            });
        }

        await tRemoveRows.commit();
        res.status(200).json({
            message: 'Row removed Successfully'
        });
    } catch (error) {
        await tRemoveRows.rollback();
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
    const tReturnRM = await models.sequelize.transaction();
    try {
        const { data, navigationId, productionId, by, companyId, userId } = req.body;
        const uoms = await models.UOM.findAll({
            where: {
                [Op.or]: [
                    { companyId: companyId, status: 1 },
                    { companyId: null, status: 0 }
                ]
            },
            raw: true,
            transaction: tReturnRM
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
            raw: true,
            transaction: tReturnRM
        });
        const itemMap = items.reduce((acc, curr) => {
            acc[curr.itemId] = curr;
            return acc;
        }, {});
        const production = await models.Production.findByPk(navigationId, { transaction: tReturnRM });
        const settings = isValidJSON(production?.isManual) || {}
        const approvalCount = await models.InventoryApproval.count({
            where: {
                companyId
            },
            transaction: tReturnRM
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
        }, { transaction: tReturnRM });

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
                order: [['createdAt', 'ASC']],
                transaction: tReturnRM
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
                }, { transaction: tReturnRM });

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
                    quantityForApproval: Number(element.returnQuantity) * (element.conversionFactor || 1)
                }, { transaction: tReturnRM });

            }
            await models.ProductionHistory.create({
                productionId: production?.id,
                actionType: settings?.['productionRawMaterial'] == 'manual' ? 'Raw material return request.' : 'Raw material returned.',
                summary: `${element?.itemName} - ${element?.returnQuantity} ${uomMap[element.uom]}, ${settings?.['productionRawMaterial'] == 'manual' ? 'requested' : 'returned'} by ${by}`
            }, { transaction: tReturnRM });
            if (settings?.['productionRawMaterial'] != 'manual') {
                const rawmaterial = await models.ProductionRawMaterials.findByPk(element.id, { transaction: tReturnRM });
                await rawmaterial.update({ issuedQuantity: rawmaterial.issuedQuantity - element?.returnQuantity }, { transaction: tReturnRM });
            }

        }

        await tReturnRM.commit();
        res.status(200).json({ message: settings?.['productionRawMaterial'] != 'manual' ? 'Raw Material Returned.' : 'Raw material return request generated.' });

    } catch (error) {
        await tReturnRM.rollback();
        console.error("Update Table Error:", error);
        res.status(500).json({
            message: "Failed to return.",
            error: error.message
        });
    }
}

async function startBulkProduction(req, res) {
    const tBulkProd = await models.sequelize.transaction();
    try {
        const { companyId, productions, mto, prefix, nextNumber } = req.body;
        const settings = await models.Settings.findOne({
            where: {
                companyId: Number(companyId)
            },
            raw: true,
            transaction: tBulkProd
        });

        const bulkProductionCount = await models.BulkProduction.count({
            where: {
                companyId
            },
            transaction: tBulkProd
        });

        const parentProduction = await models.BulkProduction.create({
            companyId,
            productionId: `BulkProduction-${bulkProductionCount + 1}`,
            status: 1
        }, { transaction: tBulkProd });

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

        const bulkProductions = await models.Production.bulkCreate(bulkProduction, { transaction: tBulkProd });
        const bulkProductionItems = bulkProductions.map((production, index) => ({
            productionId: production.id,
            documentNumber: productions[index].documentNumber,
            itemId: productions[index].itemId,
            itemName: productions[index].itemName,
            UOM: productions[index].UOM,
            quantity: productions[index].quantity,
            status: 1
        }));
        await models.ProductionItems.bulkCreate(bulkProductionItems, { transaction: tBulkProd });

        let index = 0;
        for (const production of bulkProductions) {
            const [scrapLogs, rawMaterials, finishedGoods, productionProcess, additionalCharges] = await Promise.all([
                models.BOMScrapMaterial.findAll({ where: { bomId: production.bomId }, transaction: tBulkProd }),
                models.BOMRawMaterial.findAll({ where: { bomId: production.bomId }, transaction: tBulkProd }),
                models.BOMFinishedGoods.findAll({ where: { bomId: production.bomId }, transaction: tBulkProd }),
                models.BOMProductionProcess.findAll({ where: { bomId: production.bomId }, transaction: tBulkProd }),
                models.BOMAdditionalCharges.findAll({ where: { bomId: production.bomId }, transaction: tBulkProd }),
            ]);

            const productionProcessId = productionProcess.map(data => data.processId);

            const process = await models.ProductionProcess.findAll({
                where: {
                    id: {
                        [Op.in]: productionProcessId
                    }
                },
                transaction: tBulkProd
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
                raw: true,
                transaction: tBulkProd
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
                },
                raw: true,
                transaction: tBulkProd
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
                models.ProductionSalesProcess.bulkCreate(bulkProcess, { transaction: tBulkProd }),
                models.ProductionRawMaterials.bulkCreate(bulkRawMaterial, { transaction: tBulkProd }),
                models.ProductionScrapMaterials.bulkCreate(bulkScrapMaterial, { transaction: tBulkProd }),
                models.ProductionFinishedGoods.bulkCreate(bulkFinishedGoods, { transaction: tBulkProd }),
                models.ProductionAdditionalCharges.bulkCreate(bulkAdditionalCharges, { transaction: tBulkProd }),
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
                    },
                    transaction: tBulkProd
                }
            );
        }

        await tBulkProd.commit();
        res.status(201).json({ message: 'Production Created Successfully.', data: parentProduction });
    } catch (error) {
        await tBulkProd.rollback();
        res.status(500).json({ message: 'Something went wrong' });
        console.log(error);
    }
}

async function remainingProduction(req, res) {
    try {
        const { companyId, startDate, endDate, isDiscard, status } = req.body;
        let finalStartDate;
        let finalEndDate;

        if (isDiscard) {
            return res.status(200).json({ remainingProduction: [] });
        }

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
    const t = await models.sequelize.transaction();
    try {
        const { id, companyId, userId } = req.body;

        const idsToDiscard = new Set();
        const fetchChildren = async (parentIds) => {
            if (!parentIds.length) return;

            const children = await models.Production.findAll({
                attributes: ['id'],
                where: {
                    parentProductionId: parentIds
                },
                transaction: t
            });

            const childIds = children.map(c => c.id);

            childIds.forEach(cid => idsToDiscard.add(cid));

            await fetchChildren(childIds);
        };

        idsToDiscard.add(id);

        // find bul
        const bulkProductions = await models.Production.findAll({
            attributes: ['id'],
            where: { bulkProductionId: id },
            transaction: t
        });

        const bulkIds = bulkProductions.map(p => p.id);
        bulkIds.forEach(bid => idsToDiscard.add(bid));

        // fetch all children recursively
        await fetchChildren([id, ...bulkIds]);

        // update all in one go
        await models.Production.update(
            { status: 0 },
            {
                where: {
                    id: [...idsToDiscard]
                },
                transaction: t
            },
        );

        const addApprovals = await models.InventoryApproval.findAll({
            where: {
                companyId,
                documentNumber: {
                    [Op.in]: [...idsToDiscard]
                },
                documentType: 'Finished Good',
            },
            transaction: t,
            attributes: ['id'],
            raw: true
        });

        const stockTransfers = await models.StockTransfer.findAll({
            where: {
                companyId,
                approvalId: {
                    [Op.in]: addApprovals.map(app => app.id)
                }
            },
            transaction: t
        });

        let approvalMap = {};

        for (const element of stockTransfers) {
            if (!approvalMap?.[element.productionNavigationId]) {
                const approvalCount = await models.InventoryApproval.count({
                    where: {
                        companyId
                    }
                });
                const approval = await models.InventoryApproval.create({
                    approvalId: `INA${approvalCount + 1}`,
                    documentType: 'Production Discarded - Finished Good',
                    documentNumber: element.productionNavigationId,
                    approvalStatus: 'Auto Approved',
                    requestedBy: userId,
                    companyId: companyId,
                    status: 1,
                    approvedBy: null
                }, { transaction: t });
                approvalMap[element.productionNavigationId] = approval.id;
            }
            if (element.quantity > 0) {
                let remainingQuantity = element.quantity;
                const existingStock = await models.StoreItems.findAll({
                    where: { storeId: element.toStoreId, itemId: element.itemId, isRejected: element.isRejected || false },
                    transaction: t,
                    order: [['createdAt', 'ASC']],
                });
                for (const stock of existingStock) {
                    if (remainingQuantity <= 0) break;
                    if (stock.quantity <= 0) continue;
                    const deductQty = Math.min(stock.quantity, remainingQuantity);
                    remainingQuantity -= deductQty;

                    await models.StoreItems.update(
                        { quantity: (stock.quantity - deductQty) },
                        { where: { id: stock.id }, transaction: t }
                    );
                    await models.StockTransfer.create({
                        transferNumber: generateTransferNumber(),
                        fromStoreId: element.toStoreId,
                        itemId: element.itemId,
                        quantity: deductQty * -1,
                        toStoreId: null,
                        transferDate: new Date().toISOString(),
                        transferredBy: element.transferredBy,
                        comment: 'Production Discarded',
                        companyId,
                        price: element.price,
                        actualPrice: stock.price,
                        productionId: element.productionId,
                        productionNavigationId: element.productionNavigationId,
                        isRejected: element.isRejected,
                        approvalId: approvalMap?.[element.productionNavigationId],
                        quantityForApproval: element.quantity
                    }, { transaction: t });
                }
            }
        }
        approvalMap = {};

        const scrapApprovals = await models.InventoryApproval.findAll({
            where: {
                companyId,
                documentNumber: {
                    [Op.in]: [...idsToDiscard]
                },
                documentType: 'Scrap Material',
            },
            transaction: t,
            attributes: ['id'],
            raw: true
        });

        const scrapStockTransfers = await models.StockTransfer.findAll({
            where: {
                companyId,
                approvalId: {
                    [Op.in]: scrapApprovals.map(app => app.id)
                }
            },
            transaction: t
        });

        for (const element of scrapStockTransfers) {
            if (!approvalMap?.[element.productionNavigationId]) {
                const approvalCount = await models.InventoryApproval.count({
                    where: {
                        companyId
                    }
                });
                const approval = await models.InventoryApproval.create({
                    approvalId: `INA${approvalCount + 1}`,
                    documentType: 'Production Discarded - Scrap Material',
                    documentNumber: element.productionNavigationId,
                    approvalStatus: 'Auto Approved',
                    requestedBy: userId,
                    companyId: companyId,
                    status: 1,
                    approvedBy: null
                }, { transaction: t });
                approvalMap[element.productionNavigationId] = approval.id;
            }
            if (element.quantity > 0) {
                let remainingQuantity = element.quantity;
                const existingStock = await models.StoreItems.findAll({
                    where: { storeId: element.toStoreId, itemId: element.itemId, isRejected: element.isRejected || false },
                    transaction: t,
                    order: [['createdAt', 'ASC']],
                });
                for (const stock of existingStock) {
                    if (remainingQuantity <= 0) break;
                    if (stock.quantity <= 0) continue;
                    const deductQty = Math.min(stock.quantity, remainingQuantity);
                    remainingQuantity -= deductQty;

                    await models.StoreItems.update(
                        { quantity: (stock.quantity - deductQty) },
                        { where: { id: stock.id }, transaction: t }
                    );
                    await models.StockTransfer.create({
                        transferNumber: generateTransferNumber(),
                        fromStoreId: element.toStoreId,
                        itemId: element.itemId,
                        quantity: deductQty * -1,
                        toStoreId: null,
                        transferDate: new Date().toISOString(),
                        transferredBy: element.transferredBy,
                        comment: 'Production Discarded',
                        companyId,
                        price: element.price,
                        actualPrice: stock.price,
                        productionId: element.productionId,
                        productionNavigationId: element.productionNavigationId,
                        isRejected: element.isRejected,
                        approvalId: approvalMap?.[element.productionNavigationId],
                        quantityForApproval: element.quantity
                    }, { transaction: t });
                }
            }
        }

        approvalMap = {};

        const returnApprovals = await models.InventoryApproval.findAll({
            where: {
                companyId,
                documentNumber: {
                    [Op.in]: [...idsToDiscard]
                },
                documentType: 'Raw Material Return',
            },
            transaction: t,
            attributes: ['id'],
            raw: true
        });

        const returnStockTransfers = await models.StockTransfer.findAll({
            where: {
                companyId,
                approvalId: {
                    [Op.in]: returnApprovals.map(app => app.id)
                }
            },
            transaction: t
        });

        for (const element of returnStockTransfers) {
            if (!approvalMap?.[element.productionNavigationId]) {
                const approvalCount = await models.InventoryApproval.count({
                    where: {
                        companyId
                    }
                });
                const approval = await models.InventoryApproval.create({
                    approvalId: `INA${approvalCount + 1}`,
                    documentType: 'Production Discarded - Return Raw Material',
                    documentNumber: element.productionNavigationId,
                    approvalStatus: 'Auto Approved',
                    requestedBy: userId,
                    companyId: companyId,
                    status: 1,
                    approvedBy: null
                }, { transaction: t });
                approvalMap[element.productionNavigationId] = approval.id;
            }
            if (element.quantity > 0) {
                let remainingQuantity = element.quantity;
                const existingStock = await models.StoreItems.findAll({
                    where: { storeId: element.toStoreId, itemId: element.itemId, isRejected: element.isRejected || false },
                    transaction: t,
                    order: [['createdAt', 'ASC']],
                });
                for (const stock of existingStock) {
                    if (remainingQuantity <= 0) break;
                    if (stock.quantity <= 0) continue;
                    const deductQty = Math.min(stock.quantity, remainingQuantity);
                    remainingQuantity -= deductQty;

                    await models.StoreItems.update(
                        { quantity: (stock.quantity - deductQty) },
                        { where: { id: stock.id }, transaction: t }
                    );
                    await models.StockTransfer.create({
                        transferNumber: generateTransferNumber(),
                        fromStoreId: element.toStoreId,
                        itemId: element.itemId,
                        quantity: deductQty * -1,
                        toStoreId: null,
                        transferDate: new Date().toISOString(),
                        transferredBy: element.transferredBy,
                        comment: 'Production Discarded',
                        companyId,
                        price: element.price,
                        actualPrice: stock.price,
                        productionId: element.productionId,
                        productionNavigationId: element.productionNavigationId,
                        isRejected: element.isRejected,
                        approvalId: approvalMap?.[element.productionNavigationId],
                        quantityForApproval: element.quantity
                    }, { transaction: t });
                }
            }
        }

        approvalMap = {};

        const rawApprovals = await models.InventoryApproval.findAll({
            where: {
                companyId,
                documentNumber: {
                    [Op.in]: [...idsToDiscard]
                },
                documentType: 'Raw Material',
            },
            transaction: t,
            attributes: ['id'],
            raw: true
        });

        const rawStockTransfers = await models.StockTransfer.findAll({
            where: {
                companyId,
                approvalId: {
                    [Op.in]: rawApprovals.map(app => app.id)
                }
            },
            transaction: t
        });

        for (const element of rawStockTransfers) {
            if (!approvalMap?.[element.productionNavigationId]) {
                const approvalCount = await models.InventoryApproval.count({
                    where: {
                        companyId
                    }
                });
                const approval = await models.InventoryApproval.create({
                    approvalId: `INA${approvalCount + 1}`,
                    documentType: 'Production Discarded - Raw Material',
                    documentNumber: element.productionNavigationId,
                    approvalStatus: 'Auto Approved',
                    requestedBy: userId,
                    companyId: companyId,
                    status: 1,
                    approvedBy: null
                }, { transaction: t });
                approvalMap[element.productionNavigationId] = approval.id;
            }
            if (element.quantity) {
                await models.StockTransfer.create({
                    transferNumber: generateTransferNumber(),
                    fromStoreId: null,
                    itemId: element.itemId,
                    quantity: Math.abs(element.quantity),
                    toStoreId: element.fromStoreId,
                    transferDate: new Date().toISOString(),
                    transferredBy: element.transferredBy,
                    comment: 'Production Discarded',
                    companyId,
                    price: element.price,
                    actualPrice: element.price,
                    productionId: element.productionId,
                    productionNavigationId: element.productionNavigationId,
                    isRejected: element.isRejected,
                    approvalId: approvalMap?.[element.productionNavigationId],
                    quantityForApproval: element.quantity
                }, { transaction: t });
                await models.StoreItems.create({
                    storeId: element.fromStoreId,
                    itemId: element.itemId,
                    quantity: Math.abs(element.quantity),
                    status: 1,
                    addedBy: Number(companyId),
                    price: element.price,
                    isRejected: element?.isReject || false,
                }, { transaction: t });
            }
        }

        await t.commit();
        // await t.rollback();

        return res.status(200).json({
            message: 'Production and all related productions discarded.'
        });

    } catch (error) {
        await t.rollback();
        console.error("Discard Error:", error);
        return res.status(500).json({
            message: "Failed to Discard Production",
            error: error.message,
        });
    }
}

async function bulkIssue(req, res) {
    const t = await models.sequelize.transaction();
    try {
        const { productionId, quantity, companyId,
            userId, auto, skip, finishedGoodStoreMap,
            rawMaterialStoreMap, scrapMaterialStoreMap } =
            req.body;
        let totalPrice = 0;
        const production = await models.Production.findByPk(productionId, { transaction: t });
        await production.update({
            status: 2, ...(production.productionStartDate
                ? {}
                : { productionStartDate: new Date().toISOString() })
        }, { transaction: t });
        const [finishedGoods, rawMaterials, scraps, processes, charges] = await Promise.all([
            models.ProductionFinishedGoods.findAll({ where: { productionId }, transaction: t }),
            models.ProductionRawMaterials.findAll({ where: { productionId }, transaction: t }),
            models.ProductionScrapMaterials.findAll({ where: { productionId }, transaction: t }),
            models.ProductionSalesProcess.findAll({ where: { productionId }, transaction: t }),
            models.ProductionAdditionalCharges.findAll({ where: { productionId }, transaction: t }),
        ]);
        for (const element of charges) {
            const unit = element.amount / finishedGoods[0].quantity;
            auto && await element.update({ totalCost: (element.totalCost || 0) + (unit * quantity) }, { transaction: t });
            !auto && await element.update({ currentCost: (element.currentCost || 0) + (unit * quantity) }, { transaction: t });
            totalPrice += unit * quantity;
        }
        for (const element of processes) {
            const [dd, hh, mm, ss] = element?.plannedTime?.split(":").map(Number);
            const unit = (((dd || 0) * 86400 + (hh || 0) * 3600 + (mm || 0) * 60 + (ss || 0)) / finishedGoods[0].quantity) * quantity;
            const cost = (unit / 3600) * (element.perHourCost || 0);
            totalPrice += cost;
            const current = timeToSeconds(auto ? element.totalPlannedTime : element?.currentPlannedTime);
            const result = secondsToTime(unit + current);
            await element.update({ ...(auto ? { totalPlannedTime: result, averageCost: (element.averageCost || 0) + cost } : { currentPlannedTime: result, currentaverageCost: (element.currentaverageCost || 0) + cost }), processCompleteOn: (element.processCompleteOn || 0) + quantity }, { transaction: t });
            await models.ProcessLogs.create({
                companyId: production.companyId,
                productionId: production.id,
                processId: element.id,
                quantity: quantity,
                userId
            }, { transaction: t });
        }
        for (const element of scraps) {
            const settings = isValidJSON(element?.isManual) || {};
            const approvalCount = await models.InventoryApproval.count({
                where: {
                    companyId
                },
                transaction: t
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
            }, { transaction: t });
            const unit = element.quantity / finishedGoods[0].quantity;
            if (!element.store) continue;
            const rawMaterial = await models.ProductionRawMaterials.findOne({
                where: {
                    itemId: element.itemId,
                    productionId: element.productionId
                },
                transaction: t
            });

            await models.ProductionScrapMaterials.update({ producedQuantity: (element?.producedQuantity || 0) + (unit * quantity) }, {
                where: {
                    id: element.id
                },
                transaction: t
            });

            const store = await models.Store.findOne({
                where: {
                    companyId: Number(companyId),
                    name: scrapMaterialStoreMap?.[element.itemId]?.replaceAll("-fromrejectstore", "")
                },
                transaction: t
            });

            const item = await models.Items.findOne({
                where: {
                    companyId: Number(companyId),
                    itemId: element.itemId
                },
                transaction: t
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
            }, { transaction: t });

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
            }, { transaction: t });

        }

        const [stores, items] = await Promise.all([
            models.Store.findAll({ where: { companyId: Number(companyId) }, transaction: t }),
            models.Items.findAll({
                where: {
                    companyId,
                    itemId: {
                        [Op.in]: rawMaterials.map(data => data.itemId)
                    }
                },
                transaction: t
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
                },
                transaction: t
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
            }, { transaction: t });

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
                order: [['createdAt', 'ASC']],
                transaction: t
            });
            let price = 0;
            let remainingQuantity = (unit * quantity) * (element?.conversionFactor || 1);
            for (const stock of existingStock) {
                if (remainingQuantity <= 0) break;
                if (stock.quantity <= 0) continue;
                const deductQty = Math.min(stock.quantity, remainingQuantity);
                remainingQuantity -= deductQty;
                await stock.update({ quantity: stock.quantity - deductQty }, { transaction: t });
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
                    where: { id: element.id },
                    transaction: t
                }
            );
            !auto && await models.ProductionRawMaterials.update(
                {
                    issuedQuantity: Number((element.issuedQuantity || 0)) + (unit * quantity),
                    currentAverage: (element.currentAverage || 0) + price
                },
                {
                    where: { id: element.id },
                    transaction: t
                }
            );

            if (stockTransferPayloads.length > 0) {
                await models.StockTransfer.bulkCreate(stockTransferPayloads, { transaction: t });
            }
        }
        for (const element of finishedGoods) {
            if (!finishedGoodStoreMap?.[element.itemId]) continue;
            await element.update({ producedQuantity: (element.producedQuantity || 0) + quantity, ...(auto ? { passedQuantity: (element.passedQuantity || 0) + quantity, cost: (element.cost || 0) + totalPrice } : {}), ...(!auto ? { quantityToTest: (element.quantityToTest || 0) + quantity } : {}) }, { transaction: t });
            if (auto) {
                const approvalCount = await models.InventoryApproval.count({
                    where: {
                        companyId
                    },
                    transaction: t
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
                }, { transaction: t });
                const item = await models.Items.findOne({ where: { companyId: Number(companyId), itemId: element.itemId }, transaction: t });
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
                }, { transaction: t });

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
                }, { transaction: t });
            }
            if (element.passedQuantity >= element.quantity) {
                await production.update({
                    status: 4, ...(production.productionCompletionDate
                        ? {}
                        : { productionCompletionDate: new Date().toISOString() })
                }, { transaction: t });
            }
        }

        await models.ProductionHistory.create({
            productionId,
            actionType: `Bulk Issue Requested.`,
            summary: `Bulk Issue Requested For ${quantity} Units.`
        }, { transaction: t });

        await t.commit();

        res.status(200).json({
            message: 'Bulk Issue Successfully.'
        });
    } catch (error) {
        if (t) await t.rollback();
        console.log("Bulk Issue Error:", error);
        res.status(500).json({
            message: "Internal Server Error"
        });
    }
}

async function updateStartDate(req, res) {
    try {
        const { productionId, startDate } = req.body;
        await models.Production.update({ productionStartDate: startDate }, {
            where: {
                id: productionId
            }
        });
        return res.status(200).json({
            message: "Start Date Updated."
        });

    } catch (error) {
        console.error("Discard Error:", error);
        return res.status(500).json({
            message: "Something Went Wrong.",
            error: error.message,
        });
    }
}

async function minStockMaterialPlanning(req, res) {
    try {
        const { companyId } = req.body;
        const items = await models.Items.findAll({
            where: {
                companyId,
                minStock: {
                    [Op.gt]: 0
                }
            },
            raw: true
        });
        const itemToPIdMap = items?.reduce((acc, curr) => {
            acc[curr.id] = curr.itemId;
            return acc;
        }, {});
        const storeItems = await models.StoreItems.findAll({
            where: {
                itemId: {
                    [Op.in]: items.map(item => item.id)
                },
                isRejected: false,
            },
            attributes: ['itemId', 'quantity'],
            raw: true,
        });

        const availableStockMap = storeItems?.reduce((acc, curr) => {
            if (curr.quantity > 0) acc[itemToPIdMap[curr.itemId]] = (acc[itemToPIdMap[curr.itemId]] ?? 0) + curr.quantity;
            return acc;
        }, {});

        const productions = await models.Production.findAll({
            where: {
                companyId: Number(companyId),
                status: {
                    [Op.ne]: 0
                }
            },
            attributes: ['id'],
            raw: true
        });

        const productionIds = productions.map(prod => prod.id);
        const productionRawmaterials = await models.ProductionRawMaterials.findAll({
            where: {
                productionId: productionIds,
                itemId: {
                    [Op.in]: items.map(item => item.itemId)
                }
            },
            attributes: ['itemId', 'quantity', 'conversionFactor'],
            raw: true
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

        for (const item of items) {
            item.currentStock = (availableStockMap[item.itemId] || 0)?.toFixed(2);
            item.wip = (rawMaterialQueueMap[item.itemId] || 0)?.toFixed(2);
            item.poQuantityInQueue = (purchaseQuantityInQueue[item.itemId] || 0)?.toFixed(2);
        }

        return res.status(200).json({ materialPlanningData: items });

    } catch (error) {
        console.error("Transaction Error:", error);
        return res.status(500).json({
            message: "Failed to Get Material Planning Production.",
        });
    }
}

async function saveReworkQuantity(req, res) {
    const transaction = await models.sequelize.transaction();
    try {
        const {
            store,
            rejectStore,
            finishedGoods,
            passedQty,
            rejectQty,
            companyId,
            userId,
            by,
            rejectQuantityCostPerUnit,
            comments
        } = req.body;

        const uoms = await models.UOM.findAll({
            where: {
                [Op.or]: [
                    { companyId: companyId, status: 1 },
                    { companyId: null, status: 0 }
                ]
            },
            raw: true,
            transaction
        });
        const uomMap = uoms.reduce((acc, curr) => {
            acc[curr.id] = curr.code;
            return acc;
        }, {});

        const production = await models.Production.findOne({
            where: {
                id: finishedGoods[0]?.productionId
            },
            transaction
        });

        const settings = isValidJSON(production?.isManual) || {}
        const approvalCount = await models.InventoryApproval.count({
            where: {
                companyId
            },
            transaction
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
        }, { transaction });

        const costPerUnit = (finishedGoods[0]?.reworkQuantityCost || 0) / (passedQty == 0 ? 1 : passedQty);

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

        const item = await models.Items.findOne({
            where: {
                companyId,
                itemId: finishedGoods[0]?.itemId
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
            transferredBy: userId,
            companyId,
            price: costPerUnit,
            productionId: production.productionId,
            productionNavigationId: production.id,
            approvalId: approval.id,
            quantityForApproval: passedQty * (finishedGoods[0]?.conversionFactor || 1),
            comment: comments || ''
        }, { transaction });

        await models.ProductionHistory.create({
            productionId: production?.id,
            actionType: 'Rework Quantity Tested.',
            summary: `${finishedGoods[0]?.itemName} - ${passedQty} ${uomMap[finishedGoods[0]?.uom]} passed by ${by}.`
        }, { transaction });


        if (rejectQty) {
            await models.ProductionHistory.create({
                productionId: production?.id,
                actionType: 'Rework Quantity Tested.',
                summary: `${finishedGoods[0]?.itemName} - ${rejectQty} ${uomMap[finishedGoods[0]?.uom]} rejected by ${by}.`
            }, { transaction });
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
                transferredBy: userId,
                companyId,
                price: rejectQuantityCostPerUnit || 0,
                isRejected: true,
                productionId: production.productionId,
                productionNavigationId: production.id,
                approvalId: approval.id,
                quantityForApproval: rejectQty * (finishedGoods[0]?.conversionFactor || 1),
                comment: comments || ''
            }, { transaction });
        }

        await models.ProductionFinishedGoods.update({
            passedQuantity: (finishedGoods[0]?.passedQuantity || 0) + (settings?.['productionFinishedGood'] == 'manual' ? 0 : (Number(passedQty) || 0)),
            rejectQuantity: (finishedGoods[0]?.rejectQuantity || 0) + (settings?.['productionFinishedGood'] == 'manual' ? 0 : (Number(rejectQty) || 0)),
            // cost: (finishedGoods[0]?.cost || 0),
            quantityToTest: 0,
            pendingReworkQuantity: 0,
            reworkQuantityCost: 0,
            completedReworkQuantity: (finishedGoods[0]?.completedReworkQuantity || 0) + ((Number(passedQty) || 0) + (Number(rejectQty || 0)))
        }, {
            where: {
                id: finishedGoods[0].id
            },
            transaction
        });

        const finishedGood = await models.ProductionFinishedGoods.findOne({
            where: {
                id: finishedGoods[0].id
            },
            transaction
        });
        if (finishedGood?.passedQuantity >= finishedGood?.quantity) {
            await production.update({
                status: 4, ...(production.productionCompletionDate
                    ? {}
                    : { productionCompletionDate: new Date().toISOString() })
            }, { transaction });
        }



        await transaction.commit();

        res.status(200).json({
            message: "Quantity Saved."
        });
    } catch (error) {
        await transaction.rollback();
        console.error("Transaction Error:", error);
        return res.status(500).json({
            message: "Failed to save finished goods.",
            error: error.message,
        });
    }
}
async function deleteLogs(req, res) {
    const t = await models.sequelize.transaction();
    try {
        const { productionId, processId } = req.body;

        if (!productionId || !processId) {
            await t.rollback();
            return res.status(400).json({ message: "productionId and processId are required." });
        }

        const latestLog = await models.ProcessLogs.findOne({
            where: { productionId, processId },
            order: [['createdAt', 'DESC']],
            transaction: t
        });

        if (!latestLog) {
            await t.rollback();
            return res.status(404).json({ message: "No process logs found to delete." });
        }

        const processStats = await models.ProductionSalesProcess.findOne({
            where: { productionId, id: processId },
            transaction: t
        });

        if (processStats) {
            const newCompleted = Math.max(0, (processStats.processCompleteOn || 0) - latestLog.quantity);
            await processStats.update({ processCompleteOn: newCompleted }, { transaction: t });
        }

        await latestLog.destroy({ transaction: t });

        await models.ProductionHistory.create({
            productionId,
            actionType: `Process Log Deleted.`,
            summary: `Log for ${processStats?.processName || 'process'} with quantity ${latestLog.quantity} was deleted.`
        }, { transaction: t });

        await t.commit();
        return res.status(200).json({ message: "Latest process log deleted successfully." });

    } catch (error) {
        await t.rollback();
        console.error("deleteLogs Error:", error);
        return res.status(500).json({
            message: "Something went wrong while deleting logs",
            error: error.message || error
        });
    }
}

async function getAllProductions(req, res) {
    try {
        const { companyId } = req.body;
        const productions = await models.Production.findAll({
            where: {
                companyId,
                status: {
                    [Op.ne]: 0
                }
            },
            order: [['createdAt', 'DESC']],
            attributes: ['id', 'productionId'],
            raw: true
        });
        res.status(200).json({
            productionsIds: productions
        });
    } catch (error) {
        res.status(500).json({
            message: 'Something went wrong'
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
    bulkIssue: bulkIssue,
    updateStartDate: updateStartDate,
    minStockMaterialPlanning: minStockMaterialPlanning,
    saveReworkQuantity: saveReworkQuantity,
    getAllProductions: getAllProductions,
    deleteLogs: deleteLogs
}