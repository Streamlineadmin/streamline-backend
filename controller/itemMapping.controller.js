const models = require('../models');

async function createItemMapping(req, res) {
    try {
        const { companyId, companyName, items } = req.body;

        if (!companyId || !companyName) {
            return res.status(400).json({ message: 'Company ID and Company Name are required.' });
        }

        const newItemMapping = await models.ItemMapping.create({
            companyId,
            companyName,
            items: items || [],
        });

        res.status(201).json({ message: 'Item Mapping created successfully.', data: newItemMapping });
    } catch (error) {
        console.error("Error creating Item Mapping:", error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
}

async function getAllItemMapping(req, res) {
    try {
        const { companyId } = req.body;
        if (!companyId) {
            return res.status(400).json({ message: 'Company ID is required.' });
        }
        const itemMappings = await models.ItemMapping.findAll({
            where: { companyId },
            order: [['id', 'DESC']]
        });
        res.status(200).json({ data: itemMappings });
    } catch (error) {
        console.error("Error fetching Item Mappings:", error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
}

async function updateItemMapping(req, res) {
    try {
        const { id, companyName, items } = req.body;

        if (!id) {
            return res.status(400).json({ message: 'ID is required' });
        }

        const itemMapping = await models.ItemMapping.findOne({ where: { id } });
        if (!itemMapping) {
            return res.status(404).json({ message: 'Item Mapping not found' });
        }

        await itemMapping.update({
            companyName: companyName !== undefined ? companyName : itemMapping.companyName,
            items: items !== undefined ? items : itemMapping.items,
        });

        res.status(200).json({ message: 'Item Mapping updated successfully.', data: itemMapping });
    } catch (error) {
        console.error("Error updating Item Mapping:", error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
}

async function deleteItemMapping(req, res) {
    try {
        const { id } = req.body;

        if (!id) {
            return res.status(400).json({ message: 'ID is required' });
        }

        const itemMapping = await models.ItemMapping.findOne({ where: { id } });
        if (!itemMapping) {
            return res.status(404).json({ message: 'Item Mapping not found' });
        }

        await itemMapping.destroy();

        res.status(200).json({ message: 'Item Mapping deleted successfully.' });
    } catch (error) {
        console.error("Error deleting Item Mapping:", error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
}

module.exports = {
    createItemMapping,
    getAllItemMapping,
    updateItemMapping,
    deleteItemMapping
};
