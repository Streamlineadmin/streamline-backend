
const models = require('../models');

function addTermsCondition(req, res) {
    // Check if Terms Condition  already exists for the given company
    models.addTermsConditionTermsCondition.findOne({
        where: {
            documentType: req.body.documentType, 
            companyId: req.body.companyId,
            userId: req.body.userId,
        },
    }) .then(termsConditionResult => {
        if (termsConditionResult) {
            return res.status(409).json({
                message: "Terms condition already exist!",
            });
        } else {
            // Terms ConditionResult do not exist, proceed to create
            const termsCondition = {
                companyId: req.body.companyId, 
                userId: req.body.userId,
                documentType: req.body.documentType,
                termsCondition: req.body.termsCondition,
                description: req.body.description,
                ip_address: req.body.ip_address,
                status: 1,
            };

            models.TermsCondition.create(termsCondition)
                .then(result => {
                    res.status(201).json({
                        message: "Terms condition added successfully!",
                        data: result,
                    });
                })
                .catch(error => {
                    console.error("Error creating terms condition:", error);
                    res.status(500).json({
                        message: "Something went wrong. Please try again later!",
                        error: error.message,
                    });
                });
        }
    })
    .catch(error => {
        console.error("Error finding Terms Condition:", error);
        res.status(500).json({
            message: "Something went wrong. Please try again later!",
            error: error.message,
        });
    });
}
 // Check if the logistic details already exist for the given company and logistic type, but exclude the current record
function editTermsCondition(req, res) {
    const termsConditionId = req.body.termsConditionId;
    const companyId = req.body.companyId;
    const updatedTermsConditionData = {
        companyId,
        documentType: req.body.documentType,
        termsCondition: req.body.termsCondition,
        description: req.body.description,
        ip_address: req.body.ip_address,
        status: req.body.status || 1,
    };

    // Check if the terms condition already exists for the given company but exclude the current record
    models.TermsCondition.findOne({
        where: { 
            documentType: req.body.documentType, 
            companyId, 
            id: { [models.Sequelize.Op.ne]: termsConditionId },
        },
    })
    .then(existingTermsCondition => {
        if (existingTermsCondition) {
            // If a terms condition with the same document type already exists for the company
            return res.status(409).json({
                message: "Terms condition already exists for this company!",
            });
        } else {
            // Proceed with the update
            models.TermsCondition.update(updatedTermsConditionData, { where: { id: termsConditionId } })
                .then(result => {
                    if (result[0] > 0) {
                        res.status(200).json({
                            message: "Terms condition updated successfully",
                            post: updatedTermsConditionData,
                        });
                    } else {
                        res.status(404).json({
                            message: "Terms condition not found",
                        });
                    }
                })
                .catch(error => {
                    console.error("Error updating terms condition:", error);
                    res.status(500).json({
                        message: "Something went wrong, please try again later!",
                        error: error.message || error,
                    });
                });
        }
    })
    .catch(error => {
        console.error("Error finding terms condition:", error);
        res.status(500).json({
            message: "Something went wrong, please try again later!",
            error: error.message || error,
        });
    });
}

function deleteTermsCondition(req, res) {
    const termsConditionId = req.body.termsConditionId;

    if (!termsConditionId) {
        return res.status(400).json({
            message: "Terms condition ID is required",
        });
    }

    models.TermsCondition.destroy({ where: { id: termsConditionId } })
        .then(result => {
            if (result) {
                res.status(200).json({
                    message: "Terms condition deleted successfully",
                });
            } else {
                res.status(404).json({
                    message: "Terms condition not found",
                });
            }
        })
        .catch(error => {
            console.error("Error deleting terms condition:", error);
            res.status(500).json({
                message: "Something went wrong, please try again later!",
                error: error.message || error,
            });
        });
}

function getTermsCondition(req, res) {
    models.TermsCondition.findAll({
        where: {
            companyId: req.body.companyId,
        },
    })
    .then(result => {
        if (!result || result.length === 0) {
            return res.status(200).json([]);
        }
        res.status(200).json(result);
    })
    .catch(error => {
        console.error("No terms condition found", error);
        res.status(500).json({
            message: "Something went wrong, please try again later!",
        });
    });
}

module.exports = {
    addTermsCondition: addTermsCondition,
    getTermsCondition: getTermsCondition,
    editTermsCondition: editTermsCondition,
    deleteTermsCondition: deleteTermsCondition,
};
