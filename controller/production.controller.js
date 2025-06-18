const { Op } = require('sequelize');
const { documentTypes } = require('../helpers/document-type');
const { generateProductionId, generateTransferNumber } = require('../helpers/transfer-number');
const models = require('../models');

async function startProduction(req, res) {
    try {
        const { companyId, productions } = req.body;
        const bulkProduction = productions.map(production => ({
            companyId: Number(companyId),
            productionId: generateProductionId(),
            documentNumber: production.documentNumber,
            bomId: production.bomId,
            productionEndDate: production.productionEndDate,
            assignedTo: production.assignedTo,
            createdBy: Number(companyId),
            status: 1
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

            const bulkRawMaterial = rawMaterials.map((data) => {
                const quantity = (data.quantity) / finishedGoods[0]?.quantity;
                return {
                    productionId: production.id,
                    itemId: data.itemId,
                    itemName: data.itemName,
                    store: data.store,
                    uom: data.uom,
                    quantity: productions[index].quantity * quantity,
                    status: 1
                }
            });

            const bulkAdditionalCharges = additionalCharges.map((data) => {
                const price = (data.amount) / finishedGoods[0]?.quantity;
                return {
                    productionId: production.id,
                    chargesName: data.chargesName,
                    amount: productions[index].quantity * price,
                    status: 1
                }
            });

            const bulkScrapMaterial = scrapLogs.map((data) => {
                const quantity = (data.quantity) / finishedGoods[0]?.quantity;
                return {
                    productionId: production.id,
                    itemId: data.itemId,
                    itemName: data.itemName,
                    uom: data.uom,
                    quantity: productions[index].quantity * quantity,
                    store: data.store,
                    costAllocationPercent: data.costAllocationPercent,
                    status: 1
                }
            });

            const bulkFinishedGoods = finishedGoods.map((data) => {
                return {
                    productionId: production.id,
                    itemId: data.itemId,
                    itemName: data.itemName,
                    uom: data.uom,
                    quantity: productions[index].quantity,
                    store: data.store,
                    costAllocationPercent: data.costAllocationPercent,
                    status: 1
                }
            });

            const bulkProcess = process.map((data) => {

                const [hours, minutes, seconds] = !data?.plannedTime ? [0, 0, 0] : data?.plannedTime?.split(":")?.map(Number);
                const totalMinutes = hours * 60 + minutes;
                const miniute = (productions[index]?.quantity) * (totalMinutes / finishedGoods[0]?.quantity);
                const totalSeconds = miniute * 60;

                const hour = Math.floor(totalSeconds / 3600);
                const minute = Math.floor((totalSeconds % 3600) / 60);
                const second = totalSeconds % 60;

                const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;

                return {
                    productionId: production.id,
                    cost: (miniute / data.cost) * 60,
                    plannedTime: timeString,
                    description: data.description,
                    processName: data.processName,
                    status: 1,
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
        res.status(201).json({ message: 'Production Created Successfully.', productions: bulkProductions?.map(item => item.get({ plain: true })) });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong' });
        console.log(error);
    }
}

async function getProductions(req, res) {
    try {
        const { companyId } = req.body;
        const salesDocuments = await models.Documents.findAll({
            where: {
                companyId: Number(companyId),
                documentType: documentTypes.salesOrder,
                status: {
                    [Op.notIn]: [0, 2]
                }
            },
            raw: true,
            order: [['createdAt', 'DESC']]
        });
        const salesDocumentsId = salesDocuments.map(doc => doc.documentNumber);
        const productions = await models.Production.findAll({
            where: {
                documentNumber: {
                    [Op.in]: salesDocumentsId
                },
                companyId: Number(companyId)
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
            element.items = itemsMap[element.documentNumber] || [];
        }
        const productionsIds = productions.map(prod => prod.id);
        const productionItems = await models.ProductionItems.findAll({
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
            }
        }
        const productionMap = productions.reduce((acc, current) => {
            if (acc[current.documentNumber]) {
                acc[current.documentNumber][current.productionItem.itemId] = current;
            }
            else {
                acc[current.documentNumber] = {};
                acc[current.documentNumber][current.productionItem.itemId] = current;
            }
            return acc;
        }, {});
        const items = [];
        for (const salesDocument of salesDocuments) {
            for (const item of salesDocument.items) {
                if (productionMap[salesDocument.documentNumber] && productionMap[salesDocument.documentNumber][item.itemId]) {
                    item.production = productionMap[salesDocument.documentNumber][item.itemId];
                }
                else {
                    item.production = {};
                }
                items.push(item);
            }
        }

        return res.status(200).json({ salesDocuments });

    } catch (error) {
        res.status(500).json({ message: 'Something went wrong' });
        console.log(error);
    }
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
        const [salesOrder, productionItem, bom, scrapLogs, rawMaterials, finishedGoods, process, additionalCharges] = await Promise.all([
            models.Documents.findOne({ where: { documentNumber: production.documentNumber } }),
            models.ProductionItems.findOne({ where: { productionId: production.id } }),
            models.BOMDetails.findOne({ where: { id: production.bomId } }),
            models.ProductionScrapMaterials.findAll({ where: { productionId: production.id } }),
            models.ProductionRawMaterials.findAll({ where: { productionId: production.id } }),
            models.ProductionFinishedGoods.findAll({ where: { productionId: production.id } }),
            models.ProductionSalesProcess.findAll({ where: { productionId: production.id } }),
            models.ProductionAdditionalCharges.findAll({ where: { productionId: production.id } }),
        ]);

        res.status(200).json({
            message: 'Production Data Fetched.',
            productionData: {
                salesOrder,
                production,
                productionItem,
                bom,
                scrapLogs,
                rawMaterials,
                finishedGoods,
                additionalCharges,
                process
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong' });
        console.log(error);
    }
}

async function issueRawMaterial(req, res) {
    try {
        const { rawMaterialData, companyId } = req.body;
        for (const element of rawMaterialData) {
            const store = await models.Store.findOne({
                where: {
                    companyId: Number(companyId),
                    name: element.store
                }
            });
            if (!store) break;
            if (!element?.issuedToday) continue;
            const item = await models.Items.findOne({
                where: {
                    companyId,
                    itemId: element.itemId
                }
            })
            const existingStock = await models.StoreItems.findAll({
                where: { storeId: store.id, itemId: item.id, isRejected: false },
                order: [['createdAt', 'ASC']],
            });
            let price = 0, remainingQuantity = element.issuedToday;
            for (const stock of existingStock) {
                if (remainingQuantity <= 0) break;
                if (stock.quantity <= 0) continue;
                const deductQty = Math.min(stock.quantity, remainingQuantity);
                remainingQuantity -= deductQty;

                // Reduce quantity from source store
                await models.StoreItems.update(
                    { quantity: (stock.quantity - deductQty) },
                    { where: { id: stock.id } }
                );

                await models.StockTransfer.create({
                    transferNumber: generateTransferNumber(),
                    fromStoreId: store.id,
                    itemId: item.id,
                    quantity: -deductQty,
                    toStoreId: null,
                    transferDate: new Date().toISOString(),
                    transferredBy: companyId,
                    companyId,
                    price: stock.price
                });
                price += (stock.price * deductQty);
            }
            const productionRawMaterial = await models.ProductionRawMaterials.findOne({
                where: {
                    id: element.id
                }
            });
            await models.ProductionRawMaterials.update({
                issuedQuantity: (productionRawMaterial.issuedQuantity || 0) + element.issuedToday,
                currentAverage: (((productionRawMaterial.currentAverage || 0) * (productionRawMaterial.issuedQuantity || 0)) + price) / ((productionRawMaterial.issuedQuantity || 0) + element.issuedToday)
            }, {
                where: {
                    id: element.id
                }
            });
        }

        return res.status(200).json({ message: 'Material Issued.' });
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
        const { processData } = req.body;
        for (const element of processData) {
            if (element.currentTime && element.cost) {
                const process = await models.ProductionSalesProcess.findOne({ where: { id: element.id } });
                const [hours, miniutes] = element.currentTime.split(":").map(Number);
                const totalMinutes = (hours * 60) + miniutes;
                totalCost = ((totalMinutes / 60) * element.cost);
                let currentAverageTime = '';
                if (!process.currentPlannedTime) {
                    currentAverageTime = element.currentTime;
                }
                else {
                    const [h1, m1, s1] = process.currentPlannedTime.split(":").map(Number);
                    const [h2, m2, s2] = element.currentTime.split(":").map(Number);
                    let seconds = s1 + s2;
                    let minutes = m1 + m2 + Math.floor(seconds / 60);
                    let hours = h1 + h2 + Math.floor(minutes / 60);
                    seconds = seconds % 60;
                    minutes = minutes % 60;
                    const format = (num) => String(num).padStart(2, '0');
                    currentAverageTime = `${format(hours)}:${format(minutes)}:${format(seconds)}`
                }
                await models.ProductionSalesProcess.update({ currentaverageCost: (process.currentaverageCost || 0) + totalCost, currentPlannedTime: currentAverageTime }, {
                    where: {
                        id: element.id
                    }
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
        const { additionalChargesData } = req.body;
        for (const element of additionalChargesData) {
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
        const { scrapLogs, companyId } = req.body;
        for (const element of scrapLogs) {
            await models.ProductionScrapMaterials.update({ producedQuantity: (element?.producedQuantity || 0) + element.value }, {
                where: {
                    id: element.id
                }
            });
            const store = await models.Store.findOne({
                where: {
                    companyId: Number(companyId),
                    name: element.store
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
                quantity: element.value,
                status: 1,
                addedBy: Number(companyId),
                price: 0
            });

            await models.StockTransfer.create({
                transferNumber: generateTransferNumber(),
                fromStoreId: null,
                itemId: item.id,
                quantity: element.value,
                toStoreId: store.id,
                transferDate: new Date().toISOString(),
                transferredBy: Number(companyId),
                companyId: Number(companyId),
                price: 0
            });

        }
        return res.status(200).json({ message: 'Scrap Log Updated.' });
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
            companyId
        } = req.body;

        let total = 0;

        process.forEach(data => {
            total += data.currentaverageCost || 0;
        });

        rawMaterials.forEach((data) => {
            total += (data.issuedQuantity || 0) * (data.currentAverage || 0);
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
            quantity: passedQty,
            status: 1,
            addedBy: companyId,
            price: costPerUnit
        }, { transaction });

        await models.StockTransfer.create({
            transferNumber: generateTransferNumber(),
            fromStoreId: null,
            itemId: item.id,
            quantity: passedQty,
            toStoreId: stores.id,
            transferDate: new Date().toISOString(),
            transferredBy: companyId,
            companyId,
            price: costPerUnit
        }, { transaction });

        if (rejectQty) {
            await models.StoreItems.create({
                storeId: rejectStores.id,
                itemId: item.id,
                quantity: rejectQty,
                status: 1,
                addedBy: companyId,
                price: 0,
                isRejected: true
            }, { transaction });

            await models.StockTransfer.create({
                transferNumber: generateTransferNumber(),
                fromStoreId: null,
                itemId: item.id,
                quantity: rejectQty,
                toStoreId: rejectStores.id,
                transferDate: new Date().toISOString(),
                transferredBy: companyId,
                companyId,
                price: 0,
                isRejected: true
            }, { transaction });
        }

        await models.ProductionFinishedGoods.update({
            passedQuantity: (finishedGoods[0]?.passedQuantity || 0) + passedQty,
            rejectQuantity: (finishedGoods[0]?.rejectQuantity || 0) + (rejectQty || 0),
            quantityToTest: 0
        }, {
            where: {
                id: finishedGoods[0].id
            },
            transaction
        });

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
            const [h1, m1, s1] = (element.currentPlannedTime || '00:00:00').split(":").map(Number);
            const [h2, m2, s2] = (element.totalPlannedTime || '00:00:00').split(":").map(Number);

            let seconds = s1 + s2;
            let minutes = m1 + m2 + Math.floor(seconds / 60);
            let hours = h1 + h2 + Math.floor(minutes / 60);

            seconds = seconds % 60;
            minutes = minutes % 60;

            const format = (num) => String(num).padStart(2, '0');
            const totalPlannedTime = `${format(hours)}:${format(minutes)}:${format(seconds)}`;

            await models.ProductionSalesProcess.update({
                currentPlannedTime: '00:00:00',
                totalPlannedTime,
                currentaverageCost: 0,
                averageCost: (element.averageCost || 0) + element.currentaverageCost
            }, {
                where: { id: element.id },
                transaction
            });
        }

        for (const element of rawMaterials) {
            const totalQty = (element.issuedQuantity || 0) + (element.consumedQuantity || 0);
            const avgPrice = totalQty > 0
                ? (((element.averagePrice || 0) * (element.consumedQuantity || 0)) + ((element.currentAverage || 0) * element.issuedQuantity)) / totalQty
                : 0;

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
        return res.status(200).json({ message: 'Finished Goods Saved.' });

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
    const { productionId, status } = req.body;
    try {
        await models.Production.update({ status }, {
            where: {
                id: productionId
            }
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
    const { finishedGoods } = req.body;
    try {
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

        }
        res.status(200).json({ message: 'Production Updated.' });

    } catch (error) {
        console.error("Transaction Error:", error);
        return res.status(500).json({
            message: "Failed to Update Production.",
        });
    }
}

module.exports = {
    startProduction: startProduction,
    getProductions: getProductions,
    getProductionById: getProductionById,
    issueRawMaterial: issueRawMaterial,
    updateProcess: updateProcess,
    updateCost: updateCost,
    updateScrapLogs: updateScrapLogs,
    saveFinishedGoods: saveFinishedGoods,
    updateProductionStatus: updateProductionStatus,
    saveProduction: saveProduction
}