const models = require('../models');
const uom = require('../models/uom');

function addUOM(req, res) {
    // Check if team name already exists for the given company
    models.UOM.findOne({ where: { name: req.body.name, companyId: req.body.companyId } }).then(teamResult => {
        if (teamResult) {
            return res.status(409).json({
                message: "UOM already exists!",
            });
        } else {
            // UOM does not exist, proceed to create
            const UOMData = {
                companyId: req.body.companyId,
                name: req.body.name,
                code: req.body.code,
                ip_address: req.body.ip_address,
                status: 1
            };

            models.UOM.create(UOMData).then(result => {
                res.status(201).json({
                    message: "UOM added successfully",
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

function editUOM(req, res) {
    const uomId = req.body.uomId;
    const companyId = req.body.companyId;
    const updatedUOMData = {
        companyId,
        name: req.body.name,
        code: req.body.code,
        ip_address: req.body.ip_address,
        status: req.body.status || 1  // Defaults to 1 if not provided
    };

    // Check if the UOM name already exists for the given company but exclude the current team
    models.UOM.findOne({
        where: { name: req.body.name, companyId, id: { [models.Sequelize.Op.ne]: uomId } }
    }).then(existingUOM => {
        if (existingUOM) {
            // If a team with the same name already exists for the company
            return res.status(409).json({
                message: "UOM name already exists for this company!",
            });
        } else {
            // Proceed with the update
            models.UOM.update(updatedUOMData, { where: { id: uomId } })
                .then(result => {
                    if (result[0] > 0) {
                        res.status(200).json({
                            message: "UOM updated successfully",
                            post: updatedUOMData
                        });
                    } else {
                        res.status(404).json({
                            message: "UOM not found"
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


function deleteUOM(req, res) {
    const uomId = req.body.uomId;  // Assuming the team ID is passed as a URL parameter

    models.UOM.destroy({ where: { id: uomId } })
        .then(result => {
            if (result) {
                res.status(200).json({
                    message: "UOM deleted successfully"
                });
            } else {
                res.status(200).json({
                    message: "UOM not found"
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

function getUOMs(req, res) {
    models.UOM.findAll({
        where: {
            status: 0
        },
        include: [
            {
                model: models.Company,
                where: {
                    id: req.body.companyId,
                    status: 1
                },
                attributes: [] // Exclude company fields from response if not needed
            }
        ]
    })
    .then(result => {
        if (!result || result.length === 0) {
            return res.status(200).json([]);
        }
        res.status(200).json(result);
    })
    .catch(error => {
        console.error("Error fetching UOMs:", error);
        res.status(500).json({
            message: "Something went wrong, please try again later!"
        });
    });
}



module.exports = {
    addUOM: addUOM,
    getUOMs: getUOMs,
    editUOM: editUOM,
    deleteUOM: deleteUOM
}