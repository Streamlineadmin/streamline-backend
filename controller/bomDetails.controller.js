const models = require("../models");
const { Op } = require('sequelize');

async function createBOMDetails(req, res) {
  const t = await models.sequelize.transaction();
  try {
    const {
      bomId,
      bomName,
      status,
      bomDescription,
      companyId,
      userId,
      attachments = [],
    } = req.body;
    const exists = await models.BOMDetails.findOne({
      where: { bomId, companyId, userId },
      transaction: t,
    });
    if (exists) {
      await t.rollback();
      return res.status(409).json({ message: "BOM details already exist!" });
    }
    // create BOM details
    const newDetail = await models.BOMDetails.create(
      { bomId, bomName, status, bomDescription, companyId, userId },
      { transaction: t }
    );

    // prepare attachments
    if (attachments.length) {
      const bulkData = attachments.map((name) => ({
        BOMID: bomId,
        attachmentName: name,
        companyId,
        userId,
      }));
      await models.BOMAttachments.bulkCreate(bulkData, { transaction: t });
    }

    await t.commit();
    return res
      .status(201)
      .json({ message: "BOM details saved", post: newDetail });
  } catch (error) {
    await t.rollback();
    return res
      .status(500)
      .json({ message: "Error saving BOM details", error: error.message });
  }
}

async function getBOMDetails(req, res) {
  try {
    const { companyId } = req.body;

    if (!companyId) {
      return res.status(400).json({ message: "companyId is required" });
    }

    const result = await models.BOMDetails.findAll({
      where: { companyId },
      include: [
        {
          model: models.BOMAttachments,
          as: "attachments",
          attributes: ["id", "attachmentName"],
        },
      ],
    });

    return res.status(200).json(result || []);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      message: "Something went wrong, please try again later!",
      error: error.message,
    });
  }
}

async function updateBOMDetails(req, res) {
  const t = await models.sequelize.transaction();
  try {
    const { bomId, bomName, status, bomDescription, companyId, userId } =
      req.body;

    if (!bomId || !companyId) {
      await t.rollback();
      return res
        .status(400)
        .json({ message: "bomId and companyId are required" });
    }

    // Check if BOM entry exists
    const existingBOM = await models.BOMDetails.findOne({
      where: { bomId, companyId },
      transaction: t,
    });

    if (!existingBOM) {
      await t.rollback();
      return res.status(404).json({ message: "BOM not found" });
    }

    // Check for duplicate BOM name within company, excluding current bomId
    const duplicateName = await models.BOMDetails.findOne({
      where: {
        bomName,
        companyId,
        bomId: { [models.Sequelize.Op.ne]: bomId },
      },
      transaction: t,
    });

    if (duplicateName) {
      await t.rollback();
      return res
        .status(409)
        .json({ message: "BOM name already exists for this company!" });
    }

    // Update BOM
    await models.BOMDetails.update(
      {
        bomName,
        status,
        bomDescription,
        companyId,
        userId,
      },
      {
        where: { bomId, companyId },
        transaction: t,
      }
    );

    await t.commit();
    return res.status(200).json({
      message: "BOM details updated successfully",
      post: { bomId, bomName, status, bomDescription, companyId, userId },
    });
  } catch (error) {
    await t.rollback();
    console.error("Update BOM Error:", error);
    return res.status(500).json({
      message: "Something went wrong while updating BOM details!",
      error: error.message || error,
    });
  }
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

async function getBOMById(req, res) {
  try {
    const { id, companyId } = req.body;

    if (!id || !companyId) {
      return res.status(400).json({ message: "id and companyId are required" });
    }

    const bom = await models.BOMDetails.findOne({
      where: {
        id,
        companyId,
      },
      include: [
        {
          model: models.BOMProductionProcess,
          as: "BOMProductionProcesses",
          include: [
            {
              model: models.ProductionProcess,
              attributes: [
                "processCode",
                "processName",
                "description",
                "plannedTime",
                "cost",
              ],
            },
          ],
        },
        { model: models.BOMFinishedGoods, as: "finishedGoods" },
        { model: models.BOMRawMaterial, as: "rawMaterials" },
        { model: models.BOMScrapMaterial, as: "scrapMaterials" },
        { model: models.BOMAdditionalCharges, as: "additionalCharges" },
        {
          model: models.BOMAttachments,
          as: "attachments",
          attributes: ["id", "attachmentName"],
        },
      ],
    });

    if (!bom) {
      return res.status(200).json({
        message: "No BOM found for the given ID and companyId.",
        data: {
          id: null,
          bomId: null,
          bomName: null,
          status: null,
          bomDescription: null,
          companyId,
          userId: null,
          BOMProductionProcesses: [],
          finishedGoods: [],
          rawMaterials: [],
          scrapMaterials: [],
          additionalCharges: [],
          attachments: [],
        },
      });
    }

    return res.status(200).json({
      message: "BOM details retrieved successfully.",
      data: bom,
    });
  } catch (error) {
    console.error("Get BOM Error:", error);
    return res.status(500).json({
      message: "Failed to retrieve BOM details.",
      error: error.message,
    });
  }
}

async function getAllBOMs(req, res) {
  try {
    const { companyId } = req.body;

    if (!companyId) {
      return res.status(400).json({ message: "companyId is required" });
    }

    const result = await models.BOMDetails.findAll({
      where: { companyId },
      include: [
        {
          model: models.BOMProductionProcess,
          as: "BOMProductionProcesses",
          include: [
            {
              model: models.ProductionProcess,
              attributes: [
                "processCode",
                "processName",
                "description",
                "plannedTime",
                "cost",
              ],
            },
          ],
        },
        {
          model: models.BOMFinishedGoods,
          as: "finishedGoods",
        },
        {
          model: models.BOMRawMaterial,
          as: "rawMaterials",
        },
        {
          model: models.BOMScrapMaterial,
          as: "scrapMaterials",
        },
        {
          model: models.BOMAdditionalCharges,
          as: "additionalCharges",
        },
        {
          model: models.BOMAttachments,
          as: "attachments",
          attributes: ["id", "attachmentName"],
        },
      ],
    });

    return res.status(200).json({
      message: "BOM details retrieved successfully.",
      data: result || [],
    });
  } catch (error) {
    console.error("Error fetching BOMs by company:", error);
    return res.status(500).json({
      message: "Failed to retrieve BOM details.",
      error: error.message,
    });
  }
}

async function deleteBillOfMaterials(req, res) {
  const t = await models.sequelize.transaction();
  try {
    const { id } = req.body;

    if (!id) {
      await t.rollback();
      return res
        .status(400)
        .json({ message: "id (BOM primary key) is required" });
    }

    const bom = await models.BOMDetails.findOne({
      where: { id },
      transaction: t,
    });

    if (!bom) {
      await t.rollback();
      return res.status(404).json({ message: "BOM not found" });
    }

    const bomIdString = bom.bomId;

    await Promise.all([
      models.BOMAttachments.destroy({
        where: { BOMID: bomIdString },
        transaction: t,
      }),
      models.BOMAdditionalCharges.destroy({
        where: { bomId: id },
        transaction: t,
      }),
      models.BOMScrapMaterial.destroy({ where: { bomId: id }, transaction: t }),
      models.BOMRawMaterial.destroy({ where: { bomId: id }, transaction: t }),
      models.BOMFinishedGoods.destroy({ where: { bomId: id }, transaction: t }),
      models.BOMProductionProcess.destroy({
        where: { bomId: id },
        transaction: t,
      }),
    ]);

    await models.BOMDetails.destroy({ where: { id }, transaction: t });

    await t.commit();
    return res.status(200).json({
      message: "BOM and all related records deleted successfully.",
    });
  } catch (error) {
    await t.rollback();
    console.error("Error deleting BOM:", error);
    return res.status(500).json({
      message: "Failed to delete BOM.",
      error: error.message,
    });
  }
}

async function editBillOfMaterials(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "BOM id is required" });
    }

    const bom = await BOMDetails.findOne({
      where: { id },
      include: [
        {
          model: BOMAttachments,
          as: "attachments",
          attributes: ["id", "BOMID", "attachmentName", "companyId", "userId"],
        },
        {
          model: BOMProductionProcess,
          as: "BOMProductionProcesses",
          include: [
            {
              model: require("../models").ProductionProcess,
              attributes: ["processCode", "processName", "plannedTime", "cost"],
            },
          ],
        },
        {
          model: BOMFinishedGoods,
          as: "finishedGoods",
        },
        {
          model: BOMRawMaterial,
          as: "rawMaterials",
        },
        {
          model: BOMScrapMaterial,
          as: "scrapMaterials",
        },
        {
          model: BOMAdditionalCharges,
          as: "additionalCharges",
        },
      ],
    });

    if (!bom) {
      return res.status(404).json({ message: "BOM not found" });
    }

    return res.status(200).json({
      message: "BOM fetched successfully for edit",
      data: bom,
    });
  } catch (error) {
    console.error("Error in editBillOfMaterials:", error);
    return res.status(500).json({
      message: "Failed to fetch BOM for edit",
      error: error.message,
    });
  }
}

async function getAllItemsBoms(req, res) {
  try {
    const { companyId } = req.body;

    const finishedGoods = await models.BOMFinishedGoods.findAll({
      where: {
        companyId: Number(companyId)
      }
    });

    const bomIds = finishedGoods.map(finishGood => finishGood.bomId);

    const bomDetails = await models.BOMDetails.findAll({
      where: {
        companyId,
        id: {
          [Op.in]: bomIds
        }
      },
      raw: true
    });

    const bomDetailsMap = bomDetails?.reduce((acc, current) => {
      acc[current.id] = current;
      return acc;
    }, {});

    const bomItems = {};
    for (const finishedGood of finishedGoods) {
      if (bomItems[finishedGood?.itemId]) {
        bomItems[finishedGood?.itemId].push(bomDetailsMap[finishedGood.bomId]);
      }
      else {
        bomItems[finishedGood?.itemId] = [bomDetailsMap[finishedGood.bomId]];
      }
    }

    res.status(200).json({bomItems,message:'Items Bom fetched.'});
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve BOM details.",
      error: error?.message || 'Something went wrong.',
    });
  }
}

module.exports = {
  createBOMDetails: createBOMDetails,
  updateBOMDetails: updateBOMDetails,
  getBOMDetails: getBOMDetails,
  deleteBOMDetails: deleteBOMDetails,
  getBOMById: getBOMById,
  getAllBOMs: getAllBOMs,
  deleteBillOfMaterials: deleteBillOfMaterials,
  editBillOfMaterials: editBillOfMaterials,
  getAllItemsBoms: getAllItemsBoms
};
