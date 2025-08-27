const models = require('../models');

async function updateSetting(req, res) {
    try {
        const { companyId, data } = req.body;
        const settings = await models.Settings.findOne({
            where: {
                companyId: Number(companyId)
            }
        });
        if (settings) await settings.update({ ...data });
        else await models.Settings.create({
            ...data,
            companyId: Number(companyId)
        });

        res.status(201).json({
            message: 'Preferences Saved Successfully.'
        });

    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: 'Internal Server Error.',
            error
        });
    }
}

async function getSetting(req, res) {
    try {
        const { companyId } = req.body;
        const settings = await models.Settings.findOne({
            where: {
                companyId: Number(companyId)
            },
            raw: true
        });

        res.status(200).json({
            message: 'Preferences fetched Successfully.',
            data: settings || {}
        });
    } catch (error) {
        res.status(500).json({
            message: 'Internal Server Error.',
            error
        });
    }
}

module.exports = {
    updateSetting,
    getSetting
}