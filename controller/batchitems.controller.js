const models = require('../models');
const { Op, where } = require('sequelize');

async function createBatchItems(req, res) {
    try {
        const { batchItems } = req.body;

        await models.BatchItems.bulkCreate(batchItems);
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
        const { companyId, itemIds } = req.body;
        const batchItems = await models.BatchItems.findAll({
            where: {
                item: {
                    [Op.in]: itemIds
                }
            },
            raw: true
        });

        const itemsMap = {};
        for (const element of batchItems) {
            if (element.quantity > (element.outQuantity || 0 + (element.consumedQuantity || 0))) {
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
        const { batchItems } = req.body;

        for (const element of batchItems) {
            const rawMaterial = await models.ProductionRawMaterials.find({
                where: {
                    id: element.itemId
                }
            });

            if (rawMaterial) {
                await rawMaterial.update({ batchesAssigned: (rawMaterial.batchesAssigned || 0) + element.consumedToday })
            }
            const batchItem = await models.BatchItems.find({
                where: {
                    id: element.batchId
                }
            });
            if (batchItem) {
                await batchItem.update({ consumedQuantity: (batchItem.consumedQuantity || 0) + element.consumedToday })
            }
        }

        res.status(200).json({ message: "Batches Updated Successfully." });
    } catch (error) {
        console.error("Error updating BatchItems:", error);
        return res.status(500).json({ message: "Something went wrong, please try again later!" });
    }
}

module.exports = {
    getBatchItems,
    createBatchItems,
    getBatchByItems,
    updateBatchByItems
}