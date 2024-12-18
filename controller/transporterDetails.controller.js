
const models = require('../models');

function addTransporterDetails(req, res) {
    // Check if payment terms  already exists for the given company
    models.TransporterDetails.findOne({ 
        where: { 
            name: req.body.name,
            companyId: req.body.companyId,
            userId: req.body.userId,
        } 
    }).then((existingTransporter) => {
        if (existingTransporter) {
            return res.status(409).json({
                message: "Transporter details already exist!",
            });
        } else {
            // Transporter details do not exist, proceed to create
            const transporterDetails = {
                companyId: req.body.companyId,
                name: req.body.name,
                gSTNumber: req.body.gSTNumber,
                userId: req.body.userId,
                ip_address: req.body.ip_address,
                status: 1,
            };

            models.TransporterDetails.create(transporterDetails)
                .then((result) => {
                    res.status(201).json({
                        message: "Transporter details added successfully",
                        post: result,
                    });
                })
                .catch((error) => {
                    res.status(500).json({
                        message: "Something went wrong, please try again later!",
                        error: error.message || error,
                    });
                });
        }
    })
    .catch((error) => {
        res.status(500).json({
            message: "Something went wrong, please try again later!",
            error: error.message || error,
        });
    });
}

function editTransporterDetails(req, res) {
    const transporterId = req.body.transporterId;
    const companyId = req.body.companyId;

    const updatedTransporterDetails = {
        companyId,
        name: req.body.name,
        gSTNumber: req.body.gSTNumber,
        userId: req.body.userId,
        ip_address: req.body.ip_address,
        status: req.body.status || 1,
    };

    // Check if transporter details already exist with the same name, excluding the current one
    models.TransporterDetails.findOne({
        where: {
            name: req.body.name,
            companyId,
            id: { [models.Sequelize.Op.ne]: transporterId },
        },
    })
        .then((existingTransporter) => {
            if (existingTransporter) {
                return res.status(409).json({
                    message: "Transporter details already exist for this company!",
                });
            } else {
                // Proceed with the update
                models.TransporterDetails.update(updatedTransporterDetails, { where: { id: transporterId } })
                    .then((result) => {
                        if (result[0] > 0) {
                            res.status(200).json({
                                message: "Transporter details updated successfully",
                                post: updatedTransporterDetails,
                            });
                        } else {
                            res.status(404).json({
                                message: "Transporter details not found",
                            });
                        }
                    })
                    .catch((error) => {
                        res.status(500).json({
                            message: "Something went wrong, please try again later!",
                            error: error.message || error,
                        });
                    });
            }
        })
        .catch((error) => {
            res.status(500).json({
                message: "Something went wrong, please try again later!",
                error: error.message || error,
            });
        });
}

function deleteTransporterDetails(req, res) {
    const transporterId = req.body.transporterId;

    if (!transporterId) {
        return res.status(400).json({
            message: "Transporter ID is required",
        });
    }

    models.TransporterDetails.destroy({ where: { id: transporterId } })
        .then((result) => {
            if (result) {
                res.status(200).json({
                    message: "Transporter details deleted successfully",
                });
            } else {
                res.status(404).json({
                    message: "Transporter details not found",
                });
            }
        })
        .catch((error) => {
            res.status(500).json({
                message: "Something went wrong, please try again later!",
                error: error.message || error,
            });
        });
}

function getTransporterDetails(req, res) {
    models.TransporterDetails.findAll({
        where: {
            companyId: req.body.companyId,
        },
    })
        .then((result) => {
            if (!result || result.length === 0) {
                return res.status(200).json([]);
            }
            res.status(200).json(result);
        })
        .catch((error) => {
            console.error("No transporter details found", error);
            res.status(500).json({
                message: "Something went wrong, please try again later!",
                error: error.message || error,
            });
        });
}

module.exports = {
    addTransporterDetails: addTransporterDetails,
    editTransporterDetails: editTransporterDetails,
    deleteTransporterDetails:deleteTransporterDetails,
    getTransporterDetails:getTransporterDetails
};

