const models = require("../models");

async function createCredential(req, res) {
    try {
        const { companyId, userName, password, gstin, pin } = req.body;
        await models.EInvoiceCredntial.create({
            companyId,
            userName,
            password,
            gstin,
            pin
        });
        return res.status(200).json({
            message: 'Credentials Saved Successfully.',
        })
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
}

async function getCredential(req, res) {
    try {
        const { companyId } = req.body;

        const credential = await models.EInvoiceCredntial.findOne({
            where: { companyId },
        });

        return res.status(200).json({ data: credential });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Something went wrong", error });
    }
}

async function updateCredential(req, res) {
    try {
        const { userName, password, companyId, gstin, pin } = req.body;

        const credential = await models.EInvoiceCredntial.findOne({
            where: { companyId },
        });

        if (!credential) {
            return res.status(404).json({ message: "Credentials not found." });
        }

        await credential.update({ userName, password, gstin, pin });

        return res.status(200).json({ message: "Credentials updated successfully." });
    } catch (error) {
        res.status(500).json({ message: "Something went wrong", error });
    }
}

async function deleteCredentials(req, res) {
    try {
        const { companyId } = req.body;

        await models.EInvoiceCredntial.destroy({
            where: { companyId },
        });

        return res.status(200).json({ message: "Credentials deleted successfully." });
    } catch (error) {
        res.status(500).json({ message: "Something went wrong", error });
    }
}

module.exports = {
    createCredential,
    getCredential,
    updateCredential,
    deleteCredentials
}