
const models = require('../models');

function addPaymentTerms(req, res) {
    // Check if payment terms  already exists for the given company
    models.PaymentTerms.findOne({ where: { name: req.body.name, companyId: req.body.companyId, userId: req.body.userId, } }).then(teamResult => {
        if (teamResult) {
            return res.status(409).json({
                message: "Payment terms already exists!",
            });
        } else {
            // Team does not exist, proceed to create
            const team = {
                companyId: req.body.companyId,
                name: req.body.name,
                days: req.body.days,
                userId: req.body.userId,
                description: req.body.description,
                ip_address: req.body.ip_address,
                status: 1
            };

            models.PaymentTerms.create(team).then(result => {
                res.status(201).json({
                    message: "Payment terms added successfully",
                    post: result
                });
            }).catch(error => {
                res.status(500).json({
                    message: "Something went wrong, please try again later!",
                    error: error
                });
            });
        }
    }).catch(error => {
        res.status(500).json({
            message: "Something went wrong, please try again later!",
            error: error
        });
    });
}

function editPaymentTerms(req, res) {
    const paymentTermId = req.body.paymentTermId; 
    const companyId = req.body.companyId;
    const updatedPaymentTermData = {
        companyId,
        name: req.body.name,
        paymentTermId: req.body.paymentTermId,
        days: req.body.days,
        description: req.body.description,
        ip_address: req.body.ip_address,
        status: req.body.status || 1  
    };

    // Check if the terms already exists for the given company but exclude the current terms
    models.PaymentTerms.findOne({
        where: { name: req.body.name, companyId, id: { [models.Sequelize.Op.ne]: paymentTermId  } }
    }).then(existingPaymentTerm  => {
        if (existingPaymentTerm ) {
            // If a team with the same name already exists for the company
            return res.status(409).json({
                message: "Payment term already exists for this company!",
            });
        } else {
            // Proceed with the update
            models.PaymentTerms.update(updatedPaymentTermData, { where: { id: paymentTermId } })
                .then(result => {
                    if (result[0] > 0) {
                        res.status(200).json({
                            message: "Payment terms updated successfully",
                            post: updatedPaymentTermData
                        });
                    } else {
                        res.status(404).json({
                            message: "Payment terms not found"
                        });
                    }
                })
                .catch(error => {
                    res.status(500).json({
                        message: "Something went wrong, please try again later!",
                        error: error.message || error
                    });
                });
        }
    }).catch(error => {
        res.status(500).json({
            message: "Something went wrong, please try again later!",
            error: error.message || error
        });
    });
}


function deletePaymentTerms(req, res) {
    const paymentTermId = req.body.paymentTermId;

    if (!paymentTermId) {
        return res.status(400).json({
            message: "Payment term ID is required"
        });
    }

    models.PaymentTerms.destroy({ where: { id: paymentTermId  } })
        .then(result => {
            if (result) {
                res.status(200).json({
                    message: "Payment term deleted successfully"
                });
            } else {
                res.status(200).json({
                    message: "Payment term not found"
                });
            }
        })
        .catch(error => {
            res.status(500).json({
                message: "Something went wrong, please try again later!",
                error: error
            });
        });
}

function getPaymentTerms(req, res) {
    models.PaymentTerms.findAll({
        where: {
            companyId: req.body.companyId
        }
    }).then(result => {
        if (!result || result.length === 0) {
            return res.status(200).json([]);
        }
        res.status(200).json(result);
    })
        .catch(error => {
            console.error("No payment terms found", error);
            res.status(500).json({
                message: "Something went wrong, please try again later!"
            });
        });
}

module.exports = {
    addPaymentTerms: addPaymentTerms, 
    getPaymentTerms: getPaymentTerms,
    editPaymentTerms: editPaymentTerms,
    deletePaymentTerms: deletePaymentTerms
};
