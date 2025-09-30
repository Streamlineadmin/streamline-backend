const models = require("../models");

async function addLabel(req, res) {
    try {
        const { companyId, colour, label } = req.body;
        await models.Label.create({
            colour,
            companyId,
            label
        });
        res.status(200).json({ message: 'Label Created.' });
    } catch (error) {
        res.status(500).json({
            message: 'Internal Server Error.'
        });
    }
}

async function getLabels(req, res) {
    try {
        const { companyId } = req.body;
        const labels = await models.Label.findAll({
            where: {
                companyId
            },
            raw: true,
            order: [["createdAt", "DESC"]],
        });
        res.status(200).json({ data: labels });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: 'Internal Server Error.'
        });
    }
}

async function assignLabels(req, res) {
    try {
        const { documentId, labels } = req.body;
        const doc = await models.Documents.findByPk(documentId);
        if (!doc) {
            return res.status(404).json({ message: 'Document not found.' });
        }
        await doc.update({ labels });
        res.status(200).json({ message: 'Label Updated.' });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: 'Internal Server Error.'
        });
    }
}

module.exports = {
    addLabel,
    getLabels,
    assignLabels
}