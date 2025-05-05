const models = require('../models');
const documentseries = require('../models/documentseries');

function addDocumentSeries(req, res) {
    // Check if team name already exists for the given company
    models.DocumentSeries.findOne({ where: { DocType: req.body.docType, prefix: req.body.series, companyId: req.body.companyId } }).then(documentseries => {
        if (documentseries) {
            return res.status(409).json({
                message: "Document series already exists!",
            });
        } else {
            // Document series not exist, proceed to create
            const series = {
                DocType: req.body.docType,
                seriesName: req.body.seriesName,
                prefix: req.body.series,
                number: req.body.number,
                companyId: req.body.companyId,
                default: req.body.default,
                nextNumber: req.body.nextNumber,
                status: 1,
                ip_address: req.body.ip_address,
                createdBy: req.body.userId
            };

            models.DocumentSeries.create(series).then(result => {
                res.status(201).json({
                    message: "Document series added successfully",
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

function editDocumentSeries(req, res) {
    const DocType = req.body.docType;
    const seriesName = req.body.seriesName;
    const prefix = req.body.prefix;
    const number = req.body.number;
    const companyId = req.body.companyId;

    const updatedDocumentSeriesData = {
        DocType,
        seriesName,
        prefix,
        number,
        companyId,
        status: req.body.status || 1,
        ip_address: req.body.ip_address,
        createdBy: req.body.createdBy
    };

    // Check if the team name already exists for the given company but exclude the current team
    models.DocumentSeries.findOne({
        where: { DocType: req.body.docType, seriesName: req.body.seriesName, companyId, id: { [models.Sequelize.Op.ne]: req.body.id } }
    }).then(existingSeries => {
        if (existingSeries) {
            // If a series with the same name already exists for the company
            return res.status(409).json({
                message: "Series name already exists for this company!",
            });
        } else {
            // Proceed with the update
            models.DocumentSeries.update(updatedDocumentSeriesData, { where: { id: req.body.id } })
                .then(result => {
                    if (result[0] > 0) {
                        res.status(200).json({
                            message: "Document series updated successfully",
                            post: updatedDocumentSeriesData
                        });
                    } else {
                        res.status(404).json({
                            message: "Document series not found"
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

function updateLastDocumentNumber(req, res) {
    const id = req.body.seriesId;
    const nextNumber = req.body.nextNumber;
    const companyId = req.body.companyId;

    const updatedDocumentSeriesData = { nextNumber };

    // Check if the team name already exists for the given company but exclude the current team
    models.DocumentSeries.findOne({
        where: { companyId, id: { [models.Sequelize.Op.ne]: id } }
    }).then(existingSeries => {
        // Proceed with the update
        models.DocumentSeries.update(updatedDocumentSeriesData, { where: { id: id } })
            .then(result => {
                if (result[0] > 0) {
                    res.status(200).json({
                        message: "Next number updated successfully",
                        post: updatedDocumentSeriesData
                    });
                } else {
                    res.status(404).json({
                        message: "Document series not found"
                    });
                }
            })
            .catch(error => {
                res.status(500).json({
                    message: "Something went wrong, please try again later!",
                    error: error.message || error
                });
            });
    }).catch(error => {
        res.status(500).json({
            message: "Something went wrong, please try again later!",
            error: error.message || error
        });
    });
}


function deleteDocumentSeries(req, res) {
    const id = req.body.id;  // Assuming the team ID is passed as a URL parameter

    models.DocumentSeries.destroy({ where: { id: id } })
        .then(result => {
            if (result) {
                res.status(200).json({
                    message: "Docment series deleted successfully"
                });
            } else {
                res.status(200).json({
                    message: "Document series not found"
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

function getDocumentSeries(req, res) {
    models.DocumentSeries.findAll({
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

async function setAsDefault(req, res) {
    try {
        await models.DocumentSeries.update({ default: 0 }, {
            where: {
                companyId: req.body.companyId,
                DocType: req.body.DocType
            }
        });

        await models.DocumentSeries.update({ default: 1 }, {
            where: {
                id: req.body.id
            }
        });
        res.status(200).json({ message: 'Series Successfully set as Default.' });
    } catch (error) {
        res.status(500).json({ message: 'Something Went Wrong.' });
    }
}


module.exports = {
    addDocumentSeries: addDocumentSeries,
    getDocumentSeries: getDocumentSeries,
    editDocumentSeries: editDocumentSeries,
    deleteDocumentSeries: deleteDocumentSeries,
    updateLastDocumentNumber: updateLastDocumentNumber,
    setAsDefault: setAsDefault
}