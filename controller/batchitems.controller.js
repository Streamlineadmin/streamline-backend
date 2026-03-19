const models = require('../models');
const { Op, where } = require('sequelize');

async function createBatchItems(req, res) {
    try {
        const { items, companyId, productionId } = req.body;
        const batchItems = [];
        let prefix = '', nextNumber = 0;

        for (const element of items) {
            const scrapMaterial = await models.ProductionScrapMaterials.findOne({
                where: {
                    id: element.parentRowId
                }
            });
            if (scrapMaterial) {
                await scrapMaterial.update({
                    batchesAssigned: (scrapMaterial.batchesAssigned || 0) + element?.parentQuantity
                });
            }

            for (const batch of element.batchItems) {
                prefix = batch.barCodeNumber?.prefix;
                nextNumber = batch.barCodeNumber?.number + 1;
                batchItems.push({
                    companyId: Number(companyId),
                    createdBy: Number(companyId),
                    documentNumber: productionId,
                    documentType: 'Scrap Material',
                    item: element.itemId,
                    iterationCount: element.batchItems?.length,
                    barCodeNumber: batch?.barCodeNumber,
                    manufacturingDate: batch?.manufacturingDate,
                    expiryDate: batch?.expiryDate,
                    quantity: batch?.quantity,
                    outQuantity: 0,
                    store: null,
                    status: 1,
                    isRejected: batch?.isRejected || false
                });
            }
        }

        await models.BatchItems.bulkCreate(batchItems);
        if (prefix) {
            const series = await models.DocumentSeries.findOne({
                where: {
                    companyId,
                    prefix
                }
            });
            if (series) {
                await series.update({
                    nextNumber: nextNumber
                });
            }
        }

        res.status(200).json({ message: 'Batch Items Created Successfully.' });
    } catch (error) {
        console.error("Error creating BatchItems:", error);
        return res.status(500).json({ message: "Something went wrong, please try again later!" });
    }
}

async function getBatchItems(req, res) {
    try {
        const { companyId, currentPage = 1, pageSize = 20 } = req.body;
        const offset = (currentPage - 1) * pageSize;
        const { count, rows: batchItems } = await models.BatchItems.findAndCountAll({
            where: {
                companyId: Number(companyId),
                status: 1
            },
            // limit: Number(pageSize),
            // offset: Number(offset),
            order: [['createdAt', 'DESC']],
            raw: true
        });
        const itemsId = batchItems.map(batch => batch.item);
        const items = await models.Items.findAll({
            where: {
                id: {
                    [Op.in]: itemsId
                }
            },
            attributes: ['id', 'itemName', 'itemId'],
            raw: true
        });
        const itemMap = {};
        items.forEach(item => {
            itemMap[item.id] = item;
        });

        const enrichedBatchItems = batchItems.map(batch => ({
            ...batch,
            item: itemMap[batch.item] || null
        }));

        return res.status(200).json({ data: enrichedBatchItems, total: count });
    } catch (error) {
        console.error("Error fetching BatchItems:", error);
        return res.status(500).json({ message: "Something went wrong, please try again later!" });
    }
}

async function getBatchByItems(req, res) {
    try {
        const { companyId, itemIds, fromApproval } = req.body;
        let ids = [];
        if (fromApproval) {
            const items = await models.Items.findAll({
                where: {
                    companyId: Number(companyId),
                    itemId: {
                        [Op.in]: itemIds
                    }
                },
                attributes: ['id'],
                raw: true
            });
            ids = items.map(item => item.id);
        }
        const batchItems = await models.BatchItems.findAll({
            where: { item: { [Op.in]: fromApproval ? ids : itemIds } },
            raw: true
        });

        const itemsMap = {};
        for (const element of batchItems) {
            if (element.quantity > ((element.outQuantity || 0) + (element.consumedQuantity || 0))) {
                if (itemsMap[element.item]) itemsMap[element.item].push(element);
                else itemsMap[element.item] = [element];
            }
        }

        return res.status(200).json({ data: itemsMap });
    } catch (error) {
        console.error("Error fetching BatchItems:", error);
        return res.status(500).json({ message: "Something went wrong, please try again later!" });
    }
}

async function updateBatchByItems(req, res) {
    try {
        const { batchItems, documentNumber, companyId } = req.body;
        if (documentNumber) {
            await models.Documents.update({ isBatchAssigned: true }, {
                where: {
                    documentNumber,
                    companyId: Number(companyId)
                }
            })
        }

        for (const element of batchItems) {
            if (!documentNumber) {
                const rawMaterial = await models.ProductionRawMaterials.findOne({
                    where: { id: element.itemId }
                });

                if (rawMaterial) {
                    await rawMaterial.update({
                        batchesAssigned: (rawMaterial.batchesAssigned || 0) + element.consumedToday
                    });
                }
            }
            const batchItem = await models.BatchItems.findOne({
                where: { id: element.batchId }
            });

            if (batchItem) {
                if (documentNumber) {
                    await batchItem.update({
                        outQuantity: (batchItem.outQuantity || 0) + element.consumedToday
                    });
                } else {
                    await batchItem.update({
                        consumedQuantity: (batchItem.consumedQuantity || 0) + element.consumedToday
                    });
                }
            }
        }

        res.status(200).json({ message: "Batches Updated Successfully." });
    } catch (error) {
        console.error("Error updating BatchItems:", error);
        return res.status(500).json({ message: "Something went wrong, please try again later!" });
    }
}

async function createSelectBatches(req, res) {
    const t = await models.sequelize.transaction();
    try {
        const { companyId, userId, getBatchData, productionId, approvalId, batchData, addBatchData, batches, documentNumber, documentType, store } = req.body;

        if (batchData && Array.isArray(batchData) && batchData?.length) {
            const batchItems = [];
            let prefix = '', nextNumber = 0;
            for (const element of batchData) {
                for (const batch of element.batchItems) {
                    prefix = batch.barCodeNumber?.prefix;
                    nextNumber = batch.barCodeNumber?.number + 1;
                    batchItems.push({
                        companyId: Number(companyId),
                        createdBy: Number(userId),
                        documentNumber: productionId,
                        documentType: 'Finished Good',
                        item: batch.item,
                        iterationCount: batch?.iterationCount,
                        barCodeNumber: batch?.barCodeNumber,
                        manufacturingDate: batch.manufacturingDate,
                        expiryDate: batch.expiryDate,
                        quantity: batch.quantity,
                        outQuantity: 0,
                        // store: batch?.isRejected ? rejectStores.name : stores.name,
                        status: 1,
                        isRejected: batch?.isRejected || false
                    });
                }
            }
            if (batchItems.length) {
                await models.BatchItems.bulkCreate(batchItems, { transaction: t });
                const finishedGood = await models.ProductionFinishedGoods.findOne({
                    where: {
                        productionId
                    },
                    transaction: t
                });
                if (finishedGood) {
                    await finishedGood.update({
                        batchesAssigned: finishedGood.passedQuantity,
                        rejectBatchesAssigned: finishedGood.rejectQuantity
                    }, { transaction: t });
                }
                if (prefix) {
                    const series = await models.DocumentSeries.findOne({
                        where: {
                            companyId,
                            prefix
                        }
                    });
                    if (series) {
                        await series.update({
                            nextNumber: nextNumber
                        }, { transaction: t });
                    }
                }
            }
        }
        if (batches && batches?.length) {
            const bulkBatchItems = [];
            let prefix = '', nextNumber = 0;
            for (const batch of batches) {

                for (const batchItem of batch.batchItems) {
                    prefix = batchItem.barCodeNumber?.prefix;
                    nextNumber = batchItem.barCodeNumber?.number + 1;
                    bulkBatchItems.push({
                        companyId: Number(companyId),
                        createdBy: Number(userId),
                        documentNumber,
                        documentType,
                        item: batch.item,
                        iterationCount: batch?.batchItems?.length,
                        barCodeNumber: batchItem.barCodeNumber,
                        manufacturingDate: batchItem.manufacturingDate,
                        expiryDate: batchItem.expiryDate,
                        quantity: batchItem.quantity,
                        outQuantity: 0,
                        store: store,
                        status: 1,
                        isRejected: batch?.isRejected || false
                    })
                }
            }
            if (prefix) {
                const series = await models.DocumentSeries.findOne({
                    where: {
                        companyId,
                        prefix
                    }
                });
                if (series) {
                    await series.update({
                        nextNumber: nextNumber
                    }, { transaction: t });
                }
            }
            await models?.BatchItems?.bulkCreate(bulkBatchItems, { transaction: t });
            await models.Documents.update({ isBatchAssigned: true }, {
                where: {
                    documentNumber,
                    companyId
                },
                transaction: t
            });
        }

        if (addBatchData && Array.isArray(addBatchData) && addBatchData.length) {

            const batchItems = [];
            let prefix = '', nextNumber = 0;

            for (const element of addBatchData || []) {
                for (const batch of element.children || []) {
                    prefix = batch.prefix;
                    nextNumber = batch.sequence + 1;
                    batchItems.push({
                        companyId: Number(companyId),
                        createdBy: Number(userId),
                        item: element.parentItemId,
                        documentNumber: approvalId,
                        iterationCount: element.children?.length || 0,
                        barCodeNumber: { number: batch.sequence, prefix: batch.prefix },
                        manufacturingDate: batch?.manufacturingDate,
                        expiryDate: batch?.expiryDate,
                        quantity: batch?.quantity,
                        outQuantity: 0,
                        store: null,
                        status: 1,
                        isRejected: batch?.isRejected || false
                    });
                }
            }
            if (prefix) {
                const series = await models.DocumentSeries.findOne({
                    where: {
                        companyId,
                        prefix
                    }
                });
                if (series) {
                    await series.update({
                        nextNumber: nextNumber
                    }, { transaction: t });
                }
            }
            if (batchItems.length) {
                await models.BatchItems.bulkCreate(batchItems, { transaction: t });
            }
        }

        if (getBatchData && Array.isArray(getBatchData) && getBatchData.length) {

            for (const element of getBatchData) {

                const batchItem = await models.BatchItems.findOne({
                    where: { id: element.id },
                    transaction: t,
                });

                if (batchItem) {
                    await batchItem.update({
                        outQuantity: (batchItem.outQuantity || 0) + element.consumedToday
                    }, { transaction: t });
                }
            }
        }

        approvalId && await models.InventoryApproval.update(
            { batchesAssigned: true },
            {
                where: { id: approvalId },
                transaction: t
            }
        );

        await t.commit();

        return res.status(200).json({
            message: 'Batches Updated Successfully.'
        });

    } catch (error) {
        console.log(error)
        await t.rollback();

        return res.status(500).json({
            message: 'Something Went Wrong.',
            error: error.message
        });
    }
}

module.exports = {
    getBatchItems,
    createBatchItems,
    getBatchByItems,
    updateBatchByItems,
    createSelectBatches
}