const { raw } = require("body-parser");
const { buildRawMaterialTreeWithLevel } = require("../helpers/add-level");
const models = require("../models");
const { Op } = require('sequelize');
const convertXlsxToJson = require("../helpers/bulk-upload");

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

    const bomSeries = await models.BOMSeries.findOne({
      where: {
        companyId,
        default: 1,
      },
    });

    if (bomSeries) {
      await models.BOMSeries.update(
        { nextNumber: bomSeries.nextNumber + 1 },
        {
          where: {
            id: bomSeries.id,
          },
        }
      );
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

    const plainResult = (result || []).map(bom => {
      const plain = bom.get({ plain: true });
      plain.attachments = (plain.attachments || []).map(a => a.attachmentName);
      return plain;
    });

    return res.status(200).json(plainResult);
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
    const { bomId, bomName, status, bomDescription, companyId, userId, attachments = [] } =
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
    // const duplicateName = await models.BOMDetails.findOne({
    //   where: {
    //     bomName,
    //     companyId,
    //     bomId: { [models.Sequelize.Op.ne]: bomId },
    //   },
    //   transaction: t,
    // });

    // if (duplicateName) {
    //   await t.rollback();
    //   return res
    //     .status(409)
    //     .json({ message: "BOM name already exists for this company!" });
    // }

    // Update BOM
    await models.BOMAttachments.destroy({
      where: { BOMID: bomId },
      transaction: t
    });

    // Then, if new attachments provided, insert them
    if (attachments.length) {
      const bulkData = attachments.map((name) => ({
        BOMID: bomId,
        attachmentName: name,
        companyId,
        userId,
      }));
      await models.BOMAttachments.bulkCreate(bulkData, { transaction: t });
    }
    await models.BOMDetails.update(
      {
        bomName,
        // status,
        bomDescription,
        companyId,
        userId,
      },
      {
        where: { bomId, companyId },
        transaction: t,
      }
    );

    const updatedDetail = await models.BOMDetails.findOne({
      where: { bomId, companyId },
      include: [{ model: models.BOMAttachments, as: "attachments" }],
      transaction: t,
    });

    const attachmentNames = updatedDetail.attachments.map(a => a.attachmentName);
    const plainUpdatedDetail = updatedDetail.get({ plain: true });
    plainUpdatedDetail.attachments = attachmentNames;

    await t.commit();
    return res.status(200).json({
      message: "BOM details updated successfully",
      post: plainUpdatedDetail,
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

    const bom = await models.BOMDetails.findByPk(id, {
      where: { companyId }, // still need companyId filter
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
      raw: false,
      nest: true,
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

    const finishedGoods = bom.finishedGoods.map(r => r.get({ plain: true }));
    const rawMaterials = bom.rawMaterials.map(r => r.get({ plain: true }));
    const scrapMaterials = bom.scrapMaterials.map(s => s.get({ plain: true }));
    const alternateMap = {}, alternateScrapMap = {};
    const itemIds = [...new Set([
      ...finishedGoods.map(item => item.itemId),
      ...rawMaterials
        .filter(item => !item.alternateFor)
        .map(item => item.itemId),
      ...scrapMaterials
        .filter(item => !item.alternateFor)
        .map(item => item.itemId),
    ])];
    const items = await models.Items.findAll({
      where: {
        companyId,
        itemId: {
          [Op.in]: itemIds
        }
      },
      attributes: ['id', 'itemId', 'metricsUnit'],
      raw: true
    });
    const itemsMap = items.reduce((acc, curr) => {
      acc[curr.itemId] = curr;
      return acc;
    }, {});

    const alternateUnits = await models.AlternateUnits.findAll({
      where: {
        itemId: {
          [Op.in]: items.map(item => item.id)
        }
      },
      raw: true
    });

    const altenateUnitMap = alternateUnits.reduce((acc, curr) => {
      if (!acc[curr.itemId]) acc[curr.itemId] = [];
      acc[curr.itemId].push(curr);
      return acc;
    }, {});

    finishedGoods.forEach((item) => {
      item.alternateUnits = altenateUnitMap?.[itemsMap?.[item.itemId]?.id] || [];
      item.baseUnit = itemsMap?.[item.itemId]?.metricsUnit;
      if (itemsMap?.[item.itemId]?.metricsUnit == item.uom) {
        item.conversionFactor = 1;
      }
      else {
        for (const element of item.alternateUnits) {
          if (item.uom == element.alternateUnits) {
            item.conversionFactor = element.conversionfactor;
            break;
          }
        }
      }
      item.baseUnitQuantity = item.quantity * (item.conversionFactor || 1);
    })

    rawMaterials.forEach(item => {
      if (item.alternateFor) {
        if (!alternateMap[item.alternateFor]) {
          alternateMap[item.alternateFor] = [];
        }
        alternateMap[item.alternateFor].push(item);
      }
      if (!item.alternateFor) {
        item.alternateUnits = altenateUnitMap?.[itemsMap?.[item.itemId]?.id] || [];
        item.baseUnit = itemsMap?.[item.itemId]?.metricsUnit;
        if (itemsMap?.[item.itemId]?.metricsUnit == item.uom) {
          item.conversionFactor = 1;
        }
        else {
          for (const element of item.alternateUnits) {
            if (item.uom == element.alternateUnits) {
              item.conversionFactor = element.conversionfactor;
              break;
            }
          }
        }
        item.baseUnitQuantity = item.quantity * (item.conversionFactor || 1);
      }
    });
    scrapMaterials.forEach(item => {
      if (item.alternateFor) {
        if (!alternateScrapMap[item.alternateFor]) {
          alternateScrapMap[item.alternateFor] = [];
        }
        alternateScrapMap[item.alternateFor].push(item);
      }
      if (!item.alternateFor) {
        item.alternateUnits = altenateUnitMap?.[itemsMap?.[item.itemId]?.id] || [];
        item.baseUnit = itemsMap?.[item.itemId]?.metricsUnit;
        if (itemsMap?.[item.itemId]?.metricsUnit == item.uom) {
          item.conversionFactor = 1;
        }
        else {
          for (const element of item.alternateUnits) {
            if (item.uom == element.alternateUnits) {
              item.conversionFactor = element.conversionfactor;
              break;
            }
          }
        }
        item.baseUnitQuantity = item.quantity * (item.conversionFactor || 1);
      }
    });
    const newScrap = scrapMaterials.filter(item => !item.alternateFor).map(item => {
      if (alternateScrapMap[item.itemId]) {
        item.alternates = alternateScrapMap[item.itemId];
      }
      return item;
    });
    const newRaw = rawMaterials.filter(item => !item.alternateFor).map(item => {
      if (alternateMap[item.itemId]) {
        item.alternates = alternateMap[item.itemId];
      }
      return item;
    });
    const treeWithLevel = buildRawMaterialTreeWithLevel(newRaw);

    const plainBOM = bom.get({ plain: true });
    plainBOM.rawMaterials = treeWithLevel;
    plainBOM.scrapMaterials = newScrap;
    plainBOM.finishedGoods = finishedGoods;
    plainBOM.attachments = (plainBOM.attachments || []).map(a => a.attachmentName);

    return res.status(200).json({
      message: "BOM details retrieved successfully.",
      data: plainBOM,
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
      order: [["createdAt", "DESC"]],
      raw: false,
      nest: true
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

    const bomMap = finishedGoods?.reduce((acc, current) => {
      acc[current.bomId] = current;
      return acc;
    }, {});

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
        bomItems[finishedGood?.itemId].push({ ...bomDetailsMap[finishedGood.bomId], uom: bomMap[finishedGood.bomId]?.uom });
      }
      else {
        bomItems[finishedGood?.itemId] = [{ ...bomDetailsMap[finishedGood.bomId], uom: bomMap[finishedGood.bomId]?.uom }];
      }
    }

    res.status(200).json({ bomItems, message: 'Items Bom fetched.' });
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve BOM details.",
      error: error?.message || 'Something went wrong.',
    });
  }
}

async function duplicateBom(req, res) {
  const transaction = await models.sequelize.transaction();

  try {
    const { companyId, bomId } = req.body;

    if (!companyId || !bomId) {
      return res.status(400).json({ message: "companyId and bomId are required" });
    }

    // 1️⃣ Fetch full BOM (same as getBOMById)
    const bom = await models.BOMDetails.findByPk(bomId, {
      where: { companyId },
      include: [
        {
          model: models.BOMProductionProcess,
          as: "BOMProductionProcesses",
        },
        { model: models.BOMFinishedGoods, as: "finishedGoods" },
        { model: models.BOMRawMaterial, as: "rawMaterials" },
        { model: models.BOMScrapMaterial, as: "scrapMaterials" },
        { model: models.BOMAdditionalCharges, as: "additionalCharges" },
        { model: models.BOMAttachments, as: "attachments" },
      ],
      transaction,
    });

    if (!bom) {
      await transaction.rollback();
      return res.status(404).json({ message: "BOM not found" });
    }

    // 2️⃣ Generate BOM Series
    const bomSeries = await models.BOMSeries.findOne({
      where: { companyId, default: 1 },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    const newBomseries = bomSeries.prefix + bomSeries.nextNumber;

    // 3️⃣ Duplicate BOM Master
    const bomData = bom.get({ plain: true });
    delete bomData.id;
    delete bomData.createdAt;
    delete bomData.updatedAt;

    const newBom = await models.BOMDetails.create(
      {
        ...bomData,
        bomId: newBomseries,
      },
      { transaction }
    );

    const newBOMId = newBom.id;

    // 4️⃣ Helper to bulk copy child tables
    const bulkCopy = async (Model, records) => {
      if (!records?.length) return;

      await Model.bulkCreate(
        records.map(r => {
          const obj = r.get({ plain: true }); // ✅ IMPORTANT
          delete obj.id;
          delete obj.createdAt;
          delete obj.updatedAt;
          return {
            ...obj,
            bomId: newBOMId,
          };
        }),
        { transaction }
      );
    };


    // 5️⃣ Duplicate all children
    await bulkCopy(models.BOMProductionProcess, bom.BOMProductionProcesses);
    await bulkCopy(models.BOMFinishedGoods, bom.finishedGoods);
    await bulkCopy(models.BOMRawMaterial, bom.rawMaterials);
    await bulkCopy(models.BOMScrapMaterial, bom.scrapMaterials);
    await bulkCopy(models.BOMAdditionalCharges, bom.additionalCharges);
    await bulkCopy(models.BOMAttachments, bom.attachments);

    // 6️⃣ Update series
    await bomSeries.update(
      { nextNumber: bomSeries.nextNumber + 1 },
      { transaction }
    );

    await transaction.commit();

    return res.status(201).json({
      message: "BOM duplicated successfully",
      data: {
        id: newBOMId,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Duplicate BOM Error:", error);
    return res.status(500).json({
      message: "Failed to duplicate BOM",
      error: error.message,
    });
  }
}

async function bulkUploadBom(req, res) {
  try {
    const file = req.file;
    const { companyId } = req.body;
    const data = await convertXlsxToJson(file.filename, 'bulkUploadBom');
    const ids = [];
    for (const element of data['FG']) {
      if (!element["FG Item ID"]) continue;
      ids.push(element["FG Item ID"]);
    }
    for (const element of data['RM']) {
      if (!element["Item ID"]) continue;
      ids.push(element["Item Id"]);
    }
    for (const element of data['Leftover']) {
      if (!element["Item ID"]) continue;
      ids.push(element["Item ID"]);
    }
    const items = await models.Items.findAll({
      where: {
        companyId,
        itemId: {
          [Op.in]: ids
        }
      },
      attributes: ['metricsUnit', 'id', 'itemId', 'itemName'],
      raw: true
    });
    const itemsMap = items.reduce((acc, curr) => {
      acc[curr.itemId] = curr;
      return acc;
    }, {})
    const unitMap = items.reduce((acc, curr) => {
      if (!acc[curr.id]) {
        acc[curr.id] = [];
      }
      acc[curr.id].push(Number(curr.metricsUnit));
    }, {});

    const alternateUnits = await models.AlternateUnits.findAll({
      where: { itemId: items.map(item => item.id) },
      attributes: ['itemId', 'alternateUnits'],
      raw: true,
    });

    alternateUnits.forEach((data) => {
      if (unitMap[data.itemId])
        unitMap[data.itemId] = unitMap[data.itemId].push(Number(data.alternateUnits));
    });

    const uoms = await models.UOM.findAll({
      where: {
        [Op.or]: [
          { companyId: companyId, status: 1 },
          { companyId: null, status: 0 }
        ]
      },
      raw: true
    });
    const uomMap = uoms.reduce((acc, curr) => {
      acc[curr.code] = curr;
      return acc;
    }, {});

    const store = await models.Store.findAll({
      where: {
        companyId
      },
      raw: true,
      attributes: ['id', 'name']
    });
    const storeMap = store.reduce((acc, curr) => {
      acc[curr.name] = curr.id;
      return acc;
    }, {});
    const bomSeries = await models.BOMSeries.findAll({
      where: {
        companyId
      },
      raw: true,
      attributes: ['nextNumber', 'prefix']
    });
    const bomSeriesMap = bomSeries.reduce((acc, curr) => {
      acc[curr.prefix] = curr.nextNumber;
      return acc;
    }, {});

    const errorIds = {};
    const errorData = {}

    return res.status(200).json({
      data
    })
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Something went wrong.'
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
  getAllItemsBoms: getAllItemsBoms,
  duplicateBom: duplicateBom,
  bulkUploadBom: bulkUploadBom
};
