const models = require("../models");

function addDocumentAttachments(req, res) {
  // Check if items already exists for the given company
  // console.log("Request received:", req.body);
  models.DocumentAttachments.findOne({
    where: {
      documentNumber: req.body.documentNumber,
      attachmentName: req.body.attachmentName,
    },
  })
    .then((attachments) => {
      if (attachments) {
        return res.status(409).json({
          message: "Attachments already exists!",
        });
      } else {
        // Account number does not exist, proceed to create
        const items = {
          documentNumber: req.body.documentNumber,
          attachmentName: req.body.attachmentName,
          ip_address: req.body.ip_address,
          status: 1,
        };

        models.DocumentAttachments.create(items)
          .then((result) => {
            res.status(201).json({
              message: " Attachments added successfully",
              post: result,
            });
          })
          .catch((error) => {
            res.status(500).json({
              message: "Something went wrong, please try again later!",
              error: error,
            });
          });
      }
    })
    .catch((error) => {
      res.status(500).json({
        message: "Something went wrong, please try again later!",
        error: error,
      });
    });
}

function editDocumentAttachments(req, res) {
  const documentNumber = req.body.documentNumber;
  const attachmentName = req.body.attachmentName;

  models.DocumentAttachments.findOne({
    where: {
      documentNumber: req.body.documentNumber,
      attachmentName: req.body.attachmentName,
      id: { [models.Sequelize.Op.ne]: id },
    },
  })
    .then((existingAttachment) => {
      if (existingAttachment) {
        return res.status(409).json({
          message: " Attachment already exists",
        });
      } else {
        // Proceed with the update
        models.DocumentAttachments.update(updatedAttachmentsData, {
          where: { id: id },
        })
          .then((result) => {
            if (result[0] > 0) {
              res.status(200).json({
                message: " Attachments updated successfully",
                post: updatedAttachmentsData,
              });
            } else {
              res.status(404).json({
                message: "Items not found",
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

function deleteDocumentAttachments(req, res) {
  const documentNumber = req.body.documentNumber;

  models.DocumentAttachments.destroy({ where: { id: id } })
    .then((result) => {
      if (result) {
        res.status(200).json({
          message: " Attachments deleted successfully",
        });
      } else {
        res.status(200).json({
          message: " Attachments not found",
        });
      }
    })
    .catch((error) => {
      res.status(500).json({
        message: "Something went wrong, please try again later!",
        error: error,
      });
    });
}

function getDocumentAttachments(req, res) {
  models.DocumentAttachments.findAll({
    where: {
      documentNumber: req.body.documentNumber,
    },
  })
    .then((result) => {
      if (!result || result.length === 0) {
        return res.status(200).json([]);
      }
      res.status(200).json(result);
    })
    .catch((error) => {
      console.error("Error fetching items", error);
      res.status(500).json({
        message: "Something went wrong, please try again later!",
      });
    });
}

module.exports = {
  addDocumentAttachments: addDocumentAttachments,
  getDocumentAttachments: getDocumentAttachments,
  editDocumentAttachments: editDocumentAttachments,
  deleteDocumentAttachments: deleteDocumentAttachments,
};
