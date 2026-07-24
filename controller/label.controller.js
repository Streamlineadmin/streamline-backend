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

async function editLabel(req, res) {
    try {
        const { id, label, colour } = req.body;
        const target = await models.Label.findByPk(id);
        if (!target) {
            return res.status(404).json({ message: 'Label not found.' });
        }
        await target.update({
            ...(label !== undefined && { label }),
            ...(colour !== undefined && { colour }),
        });
        res.status(200).json({ message: 'Label Updated Successfully.' });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: 'Internal Server Error.'
        });
    }
}

async function deleteLabel(req, res) {
    try {
        const { id } = req.body;
        const target = await models.Label.findByPk(id);
        if (!target) {
            return res.status(404).json({ message: 'Label not found.' });
        }
        await target.destroy();
        res.status(200).json({ message: 'Label Deleted Successfully.' });
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

async function removeLabel(req, res) {
    try {
        const { documentId, labels } = req.body;
        await models.Documents.update({ labels: labels }, {
            where: {
                id: documentId
            }
        });

        res.status(200).json({ message: 'Label Removed Successfully.' });
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
    editLabel,
    deleteLabel,
    assignLabels,
    removeLabel
}