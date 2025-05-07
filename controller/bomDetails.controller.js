const models = require("../models");

async function createBOMDetails(req, res) {
    const t = await models.sequelize.transaction();
    try {
      // create or check duplicate
      const { bomId, bomName, bomDescription, companyId, userId, attachments = [] } = req.body;
      const exists = await models.BOMDetails.findOne({ where: { bomId, companyId, userId }, transaction: t });
      if (exists) {
        await t.rollback();
        return res.status(409).json({ message: 'BOM details already exist!' });
      }
      // create BOM details
      const newDetail = await models.BOMDetails.create({ bomId, bomName, bomDescription, companyId, userId }, { transaction: t });
  
      // prepare attachments
      if (attachments.length) {
        const bulkData = attachments.map(name => ({
          BOMID: bomId,
          attachmentName: name,
          companyId,
          userId,
        }));
        await models.BOMAttachments.bulkCreate(bulkData, { transaction: t });
      }
  
      await t.commit();
      return res.status(201).json({ message: 'BOM details saved', post: newDetail });
    } catch (error) {
      await t.rollback();
      return res.status(500).json({ message: 'Error saving BOM details', error: error.message });
    }
  }

function updateBOMDetails(req, res) {
  const bomId = req.body.bomId;
  const companyId = req.body.companyId;
  const updatedBOMDetails = {
    bomName: req.body.bomName,
    bomDescription: req.body.bomDescription,
    companyId: req.body.companyId,
    userId: req.body.userId,
  };

  models.BOMDetails.findOne({
    where: {
      bomName: req.body.bomName,
      companyId,
      id: { [models.Sequelize.Op.ne]: bomId },
    },
  })
    .then((existingBOM) => {
      if (existingBOM) {
        return res.status(409).json({
          message: "BOM name already exists for this company!",
        });
      } else {
        models.BOMDetails.update(updatedBOMDetails, { where: { id: bomId } })
          .then((result) => {
            if (result[0] > 0) {
              res.status(200).json({
                message: "BOM details updated successfully",
                post: updatedBOMDetails,
              });
            } else {
              res.status(404).json({
                message: "BOM details not found",
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

function getBOMDetails(req, res) {
    const companyId = req.body.companyId;
    const userId = req.body.userId;

    models.BOMDetails.findAll({
        where: { companyId, userId },
    })
        .then((result) => {
            if (!result || result.length === 0) {
                return res.status(200).json([]);
            }
            res.status(200).json(result);
        })
        .catch((error) => {
            res.status(500).json({
                message: "Something went wrong, please try again later!",
                error: error,
            });
        });
}

function deleteBOMDetails(req, res) {
    const bomId = req.body.bomId;

    models.BOMDetails.destroy({ where: { id: bomId } })
        .then((result) => {
            if (result) {
                res.status(200).json({
                    message: "BOM details deleted successfully",
                });
            } else {
                res.status(404).json({
                    message: "BOM details not found",
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

module.exports = {
  createBOMDetails: createBOMDetails,
  updateBOMDetails: updateBOMDetails,
  getBOMDetails: getBOMDetails,
  deleteBOMDetails: deleteBOMDetails,
};
