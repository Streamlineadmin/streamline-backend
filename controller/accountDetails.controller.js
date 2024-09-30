const models = require('../models');

function addAccountDetails(req, res) {
    // Check if account number already exists for the given company
    models.AccountDetails.findOne({ where: { name: req.body.accountNumber, companyId: req.body.companyId } }).then(result => {
        if (result) {
            return res.status(409).json({
                message: "Account number already exists!",
            });
        } else {
            // Account number does not exist, proceed to create
            const team = {
                bankName: req.body.bankName,
                accountHolderName: req.body.accountHolderName,
                accountNumber: req.body.accountNumber,
                branch: req.body.branch,
                swiftCode: req.body.swiftCode,
                IFSCCode: req.body.IFSCCode,
                MICRCode: req.body.MICRCode,
                address: req.body.address,
                companyId: req.body.companyId,
                addedBy: req.body.userId,
                ip_address: req.body.ip_address,
                status: 1
            };

            models.AccountDetails.create(team).then(result => {
                res.status(201).json({
                    message: "Account details added successfully",
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

function editAccountDetails(req, res) {
    const id = req.body.id;
    const accountNumber = req.body.accountNumber;
    const companyId = req.body.companyId;
    const updatedAccountData = {
        bankName: req.body.bankName,
        accountHolderName: req.body.accountHolderName,
        accountNumber: req.body.accountNumber,
        branch: req.body.branch,
        swiftCode: req.body.swiftCode,
        IFSCCode: req.body.IFSCCode,
        MICRCode: req.body.MICRCode,
        address: req.body.address,
        companyId: req.body.companyId,
        addedBy: req.body.userId,
        ip_address: req.body.ip_address,
        status: req.body.status || 1  // Defaults to 1 if not provided
    };

    // Check if the account number  already exists for the given company but exclude the current account details
    models.Teams.findOne({
        where: { accountNumber: req.body.accountNumber, companyId: companyId, id: { [models.Sequelize.Op.ne]: id } }
    }).then(existingAccountDetails => {
        if (existingAccountDetails) {
            // If a account number with the same number already exists for the company
            return res.status(409).json({
                message: "Account number already exists for this company!",
            });
        } else {
            // Proceed with the update
            models.AccountDetails.update(updatedAccountData, { where: { id: id } })
                .then(result => {
                    if (result[0] > 0) {
                        res.status(200).json({
                            message: "Account details updated successfully",
                            post: updatedTeamData
                        });
                    } else {
                        res.status(404).json({
                            message: "Account details not found"
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


function deleteAccountDetails(req, res) {
    const id = req.body.id;  // Assuming the account ID is passed as a URL parameter

    models.AccountDetails.destroy({ where: { id: id } })
        .then(result => {
            if (result) {
                res.status(200).json({
                    message: "Account details deleted successfully"
                });
            } else {
                res.status(200).json({
                    message: "Account details not found"
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

function getAccountDetails(req, res) {
    models.AccountDetails.findAll({
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
            console.error("Error fetching blogs:", error);
            res.status(500).json({
                message: "Something went wrong, please try again later!"
            });
        });
}


module.exports = {
    addAccountDetails: addAccountDetails,
    getAccountDetails: getAccountDetails,
    editAccountDetails: editAccountDetails,
    deleteAccountDetails: deleteAccountDetails
}