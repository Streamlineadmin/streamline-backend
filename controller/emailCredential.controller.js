const models = require("../models");

async function createEmailCredential(req, res) {
    try {
        const { companyId, email, password, userId } = req.body;
        await models.EMailCredential.create({
            companyId,
            email,
            password,
            userId
        });
        return res.status(200).json({
            message: 'Credentials Saved Successfully.',
        })
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
}

async function getEmailCredential(req, res) {
    try {
        const { userId } = req.body;

        const credential = await models.EMailCredential.findOne({
            where: { userId },
        });

        return res.status(200).json({ data: credential });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Something went wrong", error });
    }
}

async function updateEmailCredential(req, res) {
    try {
        const { email, password, userId } = req.body;

        const credential = await models.EMailCredential.findOne({
            where: { userId },
        });

        if (!credential) {
            return res.status(404).json({ message: "Credentials not found." });
        }

        await credential.update({ email, password });

        return res.status(200).json({ message: "Credentials updated successfully." });
    } catch (error) {
        res.status(500).json({ message: "Something went wrong", error });
    }
}

async function deleteEmailCredentials(req, res) {
    try {
        const { userId } = req.body;

        await models.EMailCredential.destroy({
            where: { userId },
        });

        return res.status(200).json({ message: "Credentials deleted successfully." });
    } catch (error) {
        res.status(500).json({ message: "Something went wrong", error });
    }
}

module.exports = {
    createEmailCredential,
    getEmailCredential,
    updateEmailCredential,
    deleteEmailCredentials
}