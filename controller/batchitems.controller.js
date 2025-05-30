const models = require('../models');
const { Op } = require('sequelize');

async function getBatchItems(req, res) {
    try {
        const { companyId } = req.body;
        const batchItems = await models.BatchItems.findAll({
            where: {
                companyId: Number(companyId)
            },
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

        return res.status(200).json(enrichedBatchItems);
    } catch (error) {
        console.error("Error fetching BatchItems:", error);
        return res.status(500).json({ message: "Something went wrong, please try again later!" });
    }
}

module.exports = {
    getBatchItems: getBatchItems
}