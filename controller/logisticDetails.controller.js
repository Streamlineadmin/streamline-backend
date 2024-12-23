
const models = require('../models');

function addLogisticDetails(req, res) {
  // Check if Logistic Details  already exists for the given company
  models.LogisticDetails.findOne({
    where: {
      documentType: req.body.documentType,
      logisticType: req.body.logisticType,
      companyId: req.body.companyId,
      userId: req.body.userId,
    },
  })
    .then((logisticDetailsResult) => {
      if (logisticDetailsResult) {
        return res.status(409).json({
          message: "Logistic details already exist!",
        });
      } else {
        // Logistic details do not exist, proceed to create
        const logisticDetails = {
          companyId: req.body.companyId,
          userId: req.body.userId,
          documentType: req.body.documentType,
          logisticType: req.body.logisticType,
          description: req.body.description,
          ip_address: req.body.ip_address,
          status: 1,
        };

        models.LogisticDetails.create(logisticDetails)
          .then((result) => {
            res.status(201).json({
              message: "Logistic details added successfully!",
              data: result,
            });
          })
          .catch((error) => {
            console.error("Error creating Logistic details:", error);
            res.status(500).json({
              message: "Something went wrong. Please try again later!",
              error: error,
            });
          });
      }
    })
    .catch((error) => { 
      res.status(500).json({
        message: "Something went wrong. Please try again later!",
        error: error.message,
      });
    });
}
 // Check if the logistic details already exist for the given company and logistic type, but exclude the current record
function editLogisticDetails(req, res) {
    const logisticDetailId = req.body.logisticDetailId;  
    const companyId = req.body.companyId;
    const updatedLogisticData = {
        companyId,
        logisticDetailId: req.body.logisticDetailId,
        logisticType: req.body.logisticType,
        documentType: req.body.documentType, 
        description: req.body.description,
        ip_address: req.body.ip_address,
        status: req.body.status || 1  
    };

    // Check if the terms already exists for the given company but exclude the current terms
    models.LogisticDetails.findOne({
        where: { 
            logisticType: req.body.logisticType, 
            companyId, 
            documentType: req.body.documentType,
            id: { [models.Sequelize.Op.ne]: logisticDetailId } 
        }
    })
    .then(existingLogisticDetail => {
        if (existingLogisticDetail) {
            // If a logistic detail with the same type and document type already exists for the company
            return res.status(409).json({
                message: "Logistic details already exist for this company and logistic type!",
            });
        } else {
            // Proceed with the update
            models.LogisticDetails.update(updatedLogisticData, { where: { id: logisticDetailId } })
                .then(result => {
                    if (result[0] > 0) {
                        res.status(200).json({
                            message: "Logistic details updated successfully",
                            post: updatedLogisticData
                        });
                    } else {
                        res.status(404).json({
                            message: "Logistic details not found"
                        });
                    }
                })
                .catch(error => {
                    console.error("Error updating logistic details:", error);
                    res.status(500).json({
                        message: "Something went wrong, please try again later!",
                        error: error.message || error
                    });
                });
        }
    })
    .catch(error => {
        console.error("Error finding logistic details:", error);
        res.status(500).json({
            message: "Something went wrong, please try again later!",
            error: error.message || error
        });
    });
}


function deleteLogisticDetails(req, res) {
    const logisticDetailId = req.body.logisticDetailId;

    if (!logisticDetailId) {
        return res.status(400).json({
            message: "Logistic detail ID is required"
        });
    }

    models.LogisticDetails.destroy({ where: { id: logisticDetailId } })
        .then(result => {
            if (result) {
                res.status(200).json({
                    message: "Logistic detail deleted successfully"
                });
            } else {
                res.status(404).json({
                    message: "Logistic detail not found"
                });
            }
        })
        .catch(error => {
            console.error("Error deleting logistic detail:", error);
            res.status(500).json({
                message: "Something went wrong, please try again later!",
                error: error.message || error
            });
        });
}


function getLogisticDetails(req, res) {
    models.LogisticDetails.findAll({
        where: {
            companyId: req.body.companyId
        }
    })
    .then(result => {
        if (!result || result.length === 0) {
            return res.status(200).json([]);
        }
        res.status(200).json(result);
    })
    .catch(error => {
        console.error("No logistic details found", error);
        res.status(500).json({
            message: "Something went wrong, please try again later!"
        });
    });
}

module.exports = {
    addLogisticDetails: addLogisticDetails,
    getLogisticDetails: getLogisticDetails,
    editLogisticDetails: editLogisticDetails,
    deleteLogisticDetails: deleteLogisticDetails
};
