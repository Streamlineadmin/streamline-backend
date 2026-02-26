const { raw } = require('body-parser');
const models = require('../models');

async function createGateEntry(req, res) {
    try {
        const { userId, documentNumber, visitorName, visitorContact,
            visitorEmail, visitorCompany, idProofType, idProofNumber,
            purposeOfVisit, visitorImageUrl, personToMeet, vehicleNumber,
            vehicleType, comments, companyId, securitySignatureUrl, seriesId } = req.body;

        const result = await models.GateEntry.create({
            userId,
            documentNumber,
            visitorName,
            visitorContact,
            visitorEmail,
            visitorCompany,
            idProofType,
            idProofNumber,
            purposeOfVisit,
            visitorImageUrl,
            personToMeet,
            vehicleNumber,
            vehicleType,
            comments,
            companyId,
            status: 0,
            securitySignatureUrl,
        });

        if (seriesId) {
            await models.DocumentSeries.increment('nextNumber', { where: { id: seriesId } });
        }

        return res.status(201).json({
            message: "Gate Entry Created successfully",
            data: result
        });
    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong, please try again later!",
            error: error.message || error
        });
    }
}

async function getAllGateEntries(req, res) {
    try {
        const { companyId, dateRange = [] } = req.body;

        const users = await models.User.findAll({
            where: { companyId },
            attributes: ['id', 'name', 'email', 'contactNo'],
            raw: true
        });
        const userMap = users.reduce((map, user) => {
            map[user.id] = user;
            return map;
        }, {});

        let dateFilter = {};
        if (dateRange && Array.isArray(dateRange) && dateRange.length === 2) {
            const [startDate, endDate] = dateRange;
            dateFilter = {
                createdAt: {
                    [Op.between]: [
                        new Date(startDate + 'T00:00:00.000Z'),
                        new Date(endDate + 'T23:59:59.999Z')
                    ]
                }
            };
        }

        const gateEntries = await models.GateEntry.findAll({
            where: { companyId, ...dateFilter },
            order: [['createdAt', 'DESC']],
            raw: true
        });
        gateEntries.forEach(entry => {
            entry.user = userMap[entry.userId] || null;
        });
        return res.status(200).json({
            data: gateEntries
        });
    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong, please try again later!",
            error: error.message || error
        });
    }
}

async function updateGateEntry(req, res) {
    try {
        const { id } = req.body;

        const gateEntry = await models.GateEntry.findByPk(id);
        if (!gateEntry) {
            return res.status(404).json({
                message: "Gate Entry not found"
            });
        }
        await gateEntry.update({
            status: 1,
        });
        res.status(200).json({
            message: "Gate Entry updated successfully",
            data: gateEntry
        });
    } catch (error) {
        res.status(500).json({
            message: "Something went wrong, please try again later!",
            error: error.message || error
        });
    }
}

async function getGateEntriesById(req, res) {
    try {
        const { id } = req.body;
        const gateEntry = await models.GateEntry.findByPk(id);
        if (!gateEntry) {
            return res.status(404).json({
                message: "Gate Entry not found"
            });
        }
        return res.status(200).json({
            data: gateEntry
        });
    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong, please try again later!",
            error: error.message || error
        });
    }
}

module.exports = {
    createGateEntry,
    updateGateEntry,
    getGateEntriesById,
    getAllGateEntries
}