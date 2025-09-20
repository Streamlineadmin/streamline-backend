const models = require("../models");

async function addApprovalPermission(req, res) {
    try {
        const { companyId, users, documents } = req.body;
        for (const element of users) {
            const approval = await models.DocumentApproval.findOne({
                where: {
                    userId: Number(element)
                }
            });
            if (approval) {
                approval.update({ documents }, {
                    where: {
                        userId: Number(element)
                    }
                })
            }
            else {
                await models.DocumentApproval.create({
                    companyId,
                    userId: Number(element),
                    documents
                });
            }
        }
        res.status(200).json({
            message: 'Document Approval Permission Updated.'
        });
    } catch (error) {
        console.error("Error submitting demo request:", error);
        return res.status(500).json({ message: "Server error" });
    }
}

async function getApprovalPermission(req, res) {
    try {
        const { companyId, userId } = req.body;
        const approvals = await models.DocumentApproval.findAll({
            where: {
                companyId: Number(companyId),
                ...(userId ? { userId } : {}),
            },
            raw: true
        });
        res.status(200).json({
            data: approvals
        });
    } catch (error) {
        console.error("Error submitting demo request:", error);
        return res.status(500).json({ message: "Server error" });
    }
}

module.exports = {
    addApprovalPermission,
    getApprovalPermission
};
