const models = require('../models');

async function createLedgerMapping(req, res) {
    try {
        const { type, subType, ledgerName, description, companyId, userId } = req.body;

        await models.LedgerMapping.create({
            type,
            subType,
            ledgerName,
            description,
            companyId,
            userId,
            status: 1
        });

        res.status(201).json({ message: 'Ledger Mapping created successfully.' });
    } catch (error) {
        console.error("Error creating Ledger Mapping:", error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
}

async function getAllLedgerMapping(req, res) {
    try {
        const { companyId } = req.body;
        const ledgerMappings = await models.LedgerMapping.findAll({
            where: {
                companyId
            },
            order: [['id', 'DESC']]
        });
        res.status(200).json({ data: ledgerMappings });
    } catch (error) {
        console.error("Error fetching Ledger Mappings:", error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
}

async function updateLedgerMapping(req, res) {
    try {
        const { id, type, subType, ledgerName, description } = req.body;

        if (!id) {
            return res.status(400).json({ message: 'ID is required' });
        }

        const ledgerMapping = await models.LedgerMapping.findOne({ where: { id } });
        if (!ledgerMapping) {
            return res.status(404).json({ message: 'Ledger Mapping not found' });
        }

        await ledgerMapping.update({
            type,
            subType,
            ledgerName,
            description
        });

        res.status(200).json({ message: 'Ledger Mapping updated successfully.' });
    } catch (error) {
        console.error("Error updating Ledger Mapping:", error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
}

async function deleteLedgerMapping(req, res) {
    try {
        const { id } = req.body;

        if (!id) {
            return res.status(400).json({ message: 'ID is required' });
        }

        const ledgerMapping = await models.LedgerMapping.findOne({ where: { id } });
        if (!ledgerMapping) {
            return res.status(404).json({ message: 'Ledger Mapping not found' });
        }

        await ledgerMapping.destroy();

        res.status(200).json({ message: 'Ledger Mapping deleted successfully.' });
    } catch (error) {
        console.error("Error deleting Ledger Mapping:", error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
}

module.exports = {
    createLedgerMapping,
    getAllLedgerMapping,
    updateLedgerMapping,
    deleteLedgerMapping
};
