const models = require('../models');

async function addPackagingMaster(req, res) {
    try {
        const result = await models.PackagingMaster.findOne({
            where: {
                packageType: req.body.packageType,
                companyId: req.body.companyId
            }
        });

        if (result) {
            return res.status(409).json({
                message: "Packaging Master already exists for this package type!",
            });
        }

        const packagingData = {
            companyId: req.body.companyId,
            packageType: req.body.packageType,
            length: req.body.length,
            width: req.body.width,
            height: req.body.height,
            tareWeight: req.body.tareWeight,
            ip_address: req.body.ip_address,
            status: 1
        };

        const createdResult = await models.PackagingMaster.create(packagingData);
        return res.status(201).json({
            message: "Packaging Master added successfully",
            post: createdResult
        });
    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong, please try again later!",
            error: error
        });
    }
}

async function editPackagingMaster(req, res) {
    try {
        const packagingMasterId = req.body.packagingMasterId;
        const companyId = req.body.companyId;
        const updatedData = {
            companyId,
            packageType: req.body.packageType,
            length: req.body.length,
            width: req.body.width,
            height: req.body.height,
            tareWeight: req.body.tareWeight,
            ip_address: req.body.ip_address,
            status: req.body.status || 1
        };

        const existingResult = await models.PackagingMaster.findOne({
            where: {
                packageType: req.body.packageType,
                companyId,
                id: { [models.Sequelize.Op.ne]: packagingMasterId }
            }
        });

        if (existingResult) {
            return res.status(409).json({
                message: "Packaging Master already exists for this package type!",
            });
        }

        const result = await models.PackagingMaster.update(updatedData, { where: { id: packagingMasterId } });
        if (result[0] > 0) {
            return res.status(200).json({
                message: "Packaging Master updated successfully",
                post: updatedData
            });
        } else {
            return res.status(404).json({
                message: "Packaging Master not found"
            });
        }
    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong, please try again later!",
            error: error.message || error
        });
    }
}

async function deletePackagingMaster(req, res) {
    try {
        const packagingMasterId = req.body.packagingMasterId;
        const item = await models.PackagingMaster.findByPk(packagingMasterId);
        if (!item) {
            return res.status(200).json({
                message: "Packaging Master not found"
            });
        }

        const result = await models.PackagingMaster.destroy({ where: { id: packagingMasterId } });
        if (result) {
            return res.status(200).json({
                message: "Packaging Master deleted successfully"
            });
        } else {
            return res.status(200).json({
                message: "Packaging Master not found"
            });
        }
    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong, please try again later!",
            error: error
        });
    }
}

async function getPackagingMasters(req, res) {
    try {
        const result = await models.PackagingMaster.findAll({
            where: {
                companyId: req.body.companyId,
                status: 1
            }
        });

        if (!result || result.length === 0) {
            return res.status(200).json([]);
        }
        return res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching Packaging Masters:", error);
        return res.status(500).json({
            message: "Something went wrong, please try again later!",
            error: error.message
        });
    }
}

module.exports = {
    addPackagingMaster,
    editPackagingMaster,
    deletePackagingMaster,
    getPackagingMasters
};
