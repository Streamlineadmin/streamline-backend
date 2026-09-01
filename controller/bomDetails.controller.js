const { raw } = require("body-parser");
const { buildRawMaterialTreeWithLevel } = require("../helpers/add-level");
const models = require("../models");
const { Op } = require('sequelize');
const convertXlsxToJson = require("../helpers/bulk-upload");

async function createBOMDetails(req, res) {
  const t = await models.sequelize.transaction();
  try {
    const {
      bomName,
      status,
      bomDescription,
      companyId,
      userId,
      attachments = [],
    } = req.body;
    let { bomId } = req.body;

    const settings = await models.Settings.findOne({
      where: { companyId },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    const bomSeries = await models.BOMSeries.findOne({
      where: {
        companyId,
        default: 1,
      },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (bomSeries) {
      bomId = bomSeries.prefix + bomSeries.nextNumber;
      await bomSeries.update(
        { nextNumber: bomSeries.nextNumber + 1 },
        { transaction: t }
      );
    }

    if (!bomId) {
      await t.rollback();
      return res.status(400).json({ message: "bomId is required or BOM series not configured!" });
    }

    const exists = await models.BOMDetails.findOne({
      where: { bomId, companyId },
      transaction: t,
    });
    if (exists) {
      await t.rollback();
      return res.status(409).json({ message: "BOM details already exist!" });
    }

    if (settings?.uniqueBomName) {
      const duplicateName = await models.BOMDetails.findOne({
        where: { bomName, companyId },
        transaction: t,
      });

      if (duplicateName) {
        await t.rollback();
        return res.status(409).json({ message: "BOM name already exists for this company!" });
      }
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
          where: { companyId },
          required: false,
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

    const settings = await models.Settings.findOne({
      where: { companyId },
      transaction: t,
    });

    if (settings?.uniqueBomName) {
      const duplicateName = await models.BOMDetails.findOne({
        where: {
          bomName,
          companyId,
          bomId: { [Op.ne]: bomId },
        },
        transaction: t,
      });

      if (duplicateName) {
        await t.rollback();
        return res.status(409).json({ message: "BOM name already exists for this company!" });
      }
    }

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

async function deleteBOMDetails(req, res) {
  const t = await models.sequelize.transaction();
  try {
    const bomId = req.body.bomId || req.body.id;

    if (!bomId) {
      await t.rollback();
      return res.status(400).json({
        message: "bomId is required",
      });
    }

    const bomDetail = await models.BOMDetails.findOne({
      where: {
        id: bomId,
        ...(req.body.companyId ? { companyId: req.body.companyId } : {}),
      },
      transaction: t,
    });

    if (!bomDetail) {
      await t.rollback();
      return res.status(404).json({
        message: "BOM details not found",
      });
    }

    // Delete related BOM approval history data if any exist
    await models.BOMApproval.destroy({
      where: {
        [Op.or]: [
          { bomDetailId: bomDetail.id },
          { bomId: bomDetail.bomId },
        ],
        ...(req.body.companyId ? { companyId: req.body.companyId } : {}),
      },
      transaction: t,
    });

    await bomDetail.destroy({ transaction: t });

    await t.commit();
    return res.status(200).json({
      message: "BOM details deleted successfully",
    });
  } catch (error) {
    await t.rollback();
    console.error("Delete BOM Error:", error);
    return res.status(500).json({
      message: "Something went wrong, please try again later!",
      error: error.message || error,
    });
  }
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
          where: { companyId },
          required: false,
          // include: [
          //   {
          //     model: models.ProductionProcess,
          //     where: { companyId },
          //     required: false,
          //     attributes: [
          //       "processCode",
          //       "processName",
          //       "description",
          //       "plannedTime",
          //       "cost",
          //     ],
          //   },
          // ],
        },
        { model: models.BOMFinishedGoods, as: "finishedGoods", where: { companyId }, required: false },
        { model: models.BOMRawMaterial, as: "rawMaterials", where: { companyId }, required: false },
        { model: models.BOMScrapMaterial, as: "scrapMaterials", where: { companyId }, required: false },
        { model: models.BOMAdditionalCharges, as: "additionalCharges", where: { companyId }, required: false },
        {
          model: models.BOMAttachments,
          as: "attachments",
          where: { companyId },
          required: false,
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

    const isProductionOnGoing = await models.Production.findOne({
      where: {
        bomId: id,
        status: {
          [Op.in]: [1, 2, 3]
        }
      }
      ,
      transaction: t
    })
    if (isProductionOnGoing) {
      await t.rollback();
      return res.status(423).json({ message: "Cannot delete BOM details while production is ongoing" });
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
      models.BOMApproval.destroy({
        where: {
          [Op.or]: [
            { bomDetailId: id },
            { bomId: bomIdString },
          ],
        },
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
    const bulkCopy = async (Model, records, foreignKeyOverrides = { bomId: newBOMId }) => {
      if (!records?.length) return;

      await Model.bulkCreate(
        records.map(r => {
          const obj = r.get({ plain: true }); // ✅ IMPORTANT
          delete obj.id;
          delete obj.createdAt;
          delete obj.updatedAt;
          delete obj.bomId;
          delete obj.BOMID;
          return {
            ...obj,
            ...foreignKeyOverrides,
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
    await bulkCopy(models.BOMAttachments, bom.attachments, { BOMID: newBomseries });

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
  const transaction = await models.sequelize.transaction();
  try {
    const file = req.file;
    const { companyId, userId } = req.body;
    const data = await convertXlsxToJson(file.filename, 'bulkUploadBom');
    const ids = [];
    for (const element of data['FG']) {
      if (!element["FG Item ID"]) continue;
      ids.push(element["FG Item ID"]);
    }
    for (const element of data['RM']) {
      if (!element["Item Id"]) continue;
      ids.push(element["Item Id"]);
    }
    for (const element of data['Leftover']) {
      if (!element["Item Id"]) continue;
      ids.push(element["Item Id"]);
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
    }, {});
    const unitMap = items.reduce((acc, curr) => {
      if (!acc[curr.id]) {
        acc[curr.id] = [];
      }
      acc[curr.id].push(Number(curr.metricsUnit));
      return acc;
    }, {});

    const alternateUnits = await models.AlternateUnits.findAll({
      where: { itemId: items.map(item => item.id) },
      attributes: ['itemId', 'alternateUnits'],
      raw: true,
    });

    alternateUnits.forEach((data) => {
      if (unitMap[data.itemId]) {
        unitMap[data.itemId].push(Number(data.alternateUnits));
      }
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
      attributes: ['nextNumber', 'prefix', 'id']
    });
    const bomSeriesMap = bomSeries.reduce((acc, curr) => {
      acc[curr.prefix] = curr.nextNumber;
      return acc;
    }, {});

    const processes = await models.ProductionProcess.findAll({
      where: {
        companyId
      },
      raw: true,
      attributes: ['id', 'processName']
    });
    const processMap = processes.reduce((acc, curr) => {
      acc[curr.processName] = curr.id;
      return acc;
    }, {});

    const payload = [];
    const siMap = {};
    for (const element of data['FG']) {
      const { Sl_No, "FG Item ID": itemId, "FG UOM": uom, "BOM Series": series,
        "BOM Name": bomName, "FG Store": store, "FG Quantity": Quantity } = element;
      if (Sl_No && siMap[Sl_No]) {
        if (!payload['Unknown']) {
          payload['Unknown'] = {};
        }
        if (!payload['Unknown']['FG']) {
          payload['Unknown']['FG'] = [];
        }
        payload['Unknown']['FG'].push({ ...element, Error: "Duplicate Sl_No" });
        continue;
      } else {
        siMap[Sl_No] = true;
      }
      const id = Sl_No || 'Unknown';
      const error = [];
      if (!Sl_No) {
        error.push("Sl_No is required");
      }
      if (!itemId) {
        error.push("FG Item ID is required");
      }
      if (Quantity == 0 || !Quantity || isNaN(Quantity)) {
        error.push("Quantity is required and must be a number");
      }
      if (!unitMap?.[itemsMap?.[itemId]?.id]?.includes(uomMap?.[uom]?.id)) {
        error.push("Invalid UOM");
      }
      if (!bomSeriesMap?.[series]) {
        error.push("Invalid BOM Series");
      }
      if (!bomName?.trim()) {
        error.push("BOM Name is required");
      }
      if (store && !storeMap?.[store]) {
        error.push("Invalid Store");
      }
      if (!payload[id]) {
        payload[id] = {};
      }
      if (!payload[id]['FG']) {
        payload[id]['FG'] = [];
      }
      payload[id]['FG'].push({ ...element, Error: error.join(", ") });
      if (error.length) {
        payload[id].error = true;
      }
    }

    for (const element of data['RM']) {
      const { "Sl_No (FG Sheet)": Sl_No, "Item Id": itemId, "UOM": uom, "RM Store": store, Quantity } = element;
      if (!Sl_No) {
        if (!payload['Unknown']) {
          payload['Unknown'] = {};
        }
        if (!payload['Unknown']['RM']) {
          payload['Unknown']['RM'] = [];
        }
        payload['Unknown']['RM'].push({ ...element, Error: "Sl_No is required" });
        continue;
      }
      if (Sl_No && !siMap[Sl_No]) {
        if (!payload['Unknown']) {
          payload['Unknown'] = {};
        }
        if (!payload['Unknown']['RM']) {
          payload['Unknown']['RM'] = [];
        }
        payload['Unknown']['RM'].push({ ...element, Error: "Invalid Sl_No" });
        continue;
      }
      const id = Sl_No;
      const error = [];
      if (!itemId) {
        error.push("RM Item ID is required");
      }
      if (!unitMap?.[itemsMap?.[itemId]?.id]?.includes(uomMap?.[uom]?.id)) {
        error.push("Invalid UOM");
      }
      if (Quantity == 0 || !Quantity || isNaN(Quantity)) {
        error.push("Quantity is required and must be a number");
      }
      if (store && !storeMap?.[store]) {
        error.push("Invalid Store");
      }
      if (!payload[id]) {
        payload[id] = {};
      }
      if (!payload[id]['RM']) {
        payload[id]['RM'] = [];
      }
      payload[id]['RM'].push({ ...element, Error: error.join(", ") });
      if (error.length) {
        payload[id].error = true;
      }
    }

    for (const element of data['Leftover']) {
      const { "Sl_No (FG Sheet)": Sl_No, "Item Id": itemId, "UOM": uom, "Leftover Store": store, Quantity } = element;
      if (!Sl_No) {
        if (!payload['Unknown']) {
          payload['Unknown'] = {};
        } if (!payload['Unknown']['Leftover']) {
          payload['Unknown']['Leftover'] = [];
        }
        payload['Unknown']['Leftover'].push({ ...element, Error: "Sl_No is required" });
        continue;
      }
      if (Sl_No && !siMap[Sl_No]) {
        if (!payload['Unknown']) {
          payload['Unknown'] = {};
        }
        if (!payload['Unknown']['Leftover']) {
          payload['Unknown']['Leftover'] = [];
        }
        payload['Unknown']['Leftover'].push({ ...element, Error: "Invalid Sl_No" });
        continue;
      }
      const id = Sl_No;
      const error = [];
      if (!itemId) {
        error.push("Leftover Item ID is required");
      }
      if (!unitMap?.[itemsMap?.[itemId]?.id]?.includes(uomMap?.[uom]?.id)) {
        error.push("Invalid UOM");
      }
      if (Quantity == 0 || !Quantity || isNaN(Quantity)) {
        error.push("Quantity is required and must be a number");
      }
      if (store && !storeMap?.[store]) {
        error.push("Invalid Store");
      }
      if (!payload[id]) {
        payload[id] = {};
      }
      if (!payload[id]['Leftover']) {
        payload[id]['Leftover'] = [];
      }
      payload[id]['Leftover'].push({ ...element, Error: error.join(", ") });
      if (error.length) {
        payload[id].error = true;
      }
    }

    for (const element of data['Production Process']) {
      const { "Sl_No (FG Sheet)": Sl_No, "Process Name": processName, "Process Id": processId } = element;
      if (!Sl_No) {
        if (!payload['Unknown']) {
          payload['Unknown'] = {};
        }
        if (!payload['Unknown']['Production Process']) {
          payload['Unknown']['Production Process'] = [];
        }
        payload['Unknown']['Production Process'].push({ ...element, Error: "Sl_No is required" });
        continue;
      }
      if (Sl_No && !siMap[Sl_No]) {
        if (!payload['Unknown']) {
          payload['Unknown'] = {};
        }
        if (!payload['Unknown']['Production Process']) {
          payload['Unknown']['Production Process'] = [];
        }
        payload['Unknown']['Production Process'].push({ ...element, Error: "Invalid Sl_No" });
        continue;
      }
      const id = Sl_No;
      const error = [];
      if (!processName) {
        error.push("Process Name is required");
      }
      if (!processMap?.[processName]) {
        error.push("Process Name Not Found.");
      }
      if (!payload[id]) {
        payload[id] = {};
      }
      if (!payload[id]['Production Process']) {
        payload[id]['Production Process'] = [];
      }
      payload[id]['Production Process'].push({ ...element, Error: error.join(", ") });
      if (error.length) {
        payload[id].error = true;
      }
    }

    for (const element of data['Other Charges']) {
      const { "Sl_No (FG Sheet)": Sl_No, "Charges Name": chargeName, "Amount (INR)": amount } = element;
      if (!Sl_No) {
        if (!payload['Unknown']) {
          payload['Unknown'] = {};
        }
        if (!payload['Unknown']['Other Charges']) {
          payload['Unknown']['Other Charges'] = [];
        }
        payload['Unknown']['Other Charges'].push({ ...element, Error: "Sl_No is required" });
        continue;
      }
      if (Sl_No && !siMap[Sl_No]) {
        if (!payload['Unknown']) {
          payload['Unknown'] = {};
        }
        if (!payload['Unknown']['Other Charges']) {
          payload['Unknown']['Other Charges'] = [];
        }
        payload['Unknown']['Other Charges'].push({ ...element, Error: "Invalid Sl_No" });
        continue;
      }
      const id = Sl_No;
      const error = [];
      if (!chargeName) {
        error.push("Charge Name is required");
      }
      if (amount == 0 || !amount || isNaN(amount)) {
        error.push("Amount is required and must be a number");
      }
      if (!payload[id]) {
        payload[id] = {};
      }
      if (!payload[id]['Other Charges']) {
        payload[id]['Other Charges'] = [];
      }
      payload[id]['Other Charges'].push({ ...element, Error: error.join(", ") });
      if (error.length) {
        payload[id].error = true;
      }
    }

    const errorData = {
      FG: [],
      RM: [],
      Leftover: [],
      ["Production Process"]: [],
      ["Other Charges"]: []
    }

    const validData = {};

    for (const key in payload) {
      if (payload[key].error || key == 'Unknown' || !payload[key]['RM'] || !payload[key]['RM']?.length) {
        if (payload[key]['FG'] || key == 'Unknown') {
          errorData.FG.push(...(Array.isArray(payload[key]['FG']) ? payload[key]['FG'] : []));
        }
        if (payload[key]['RM']) {
          errorData.RM.push(...(Array.isArray(payload[key]['RM']) ? payload[key]['RM'] : []));
        }
        if (payload[key]['Leftover']) {
          errorData.Leftover.push(...(Array.isArray(payload[key]['Leftover']) ? payload[key]['Leftover'] : []));
        }
        if (payload[key]['Production Process']) {
          errorData["Production Process"].push(...(Array.isArray(payload[key]['Production Process']) ? payload[key]['Production Process'] : []));
        }
        if (payload[key]['Other Charges']) {
          errorData["Other Charges"].push(...(Array.isArray(payload[key]['Other Charges']) ? payload[key]['Other Charges'] : []));
        }
      }
      else {
        validData[key] = {
          bomDetails: {
            bomId: payload[key]['FG'][0]?.['BOM Series'] + bomSeriesMap?.[payload[key]['FG'][0]?.['BOM Series']],
            bomName: payload[key]['FG'][0]?.['BOM Name'],
            status: 1,
            bomDescription: payload[key]['FG'][0]?.['BOM Description'],
            companyId,
            userId
          },
          finishedGoods: payload[key]['FG']?.map(fg => ({
            itemId: fg['FG Item ID'],
            itemName: itemsMap?.[fg['FG Item ID']]?.itemName,
            uom: uomMap?.[fg['FG UOM']].id,
            quantity: fg['FG Quantity'],
            store: fg['FG Store'],
            userId,
            companyId,
            status: 1,
          })),
          rawMaterials: payload[key]['RM']?.map(rm => ({
            itemId: rm['Item Id'],
            itemName: itemsMap?.[rm['Item Id']]?.itemName,
            uom: uomMap?.[rm['UOM']].id,
            quantity: rm['Quantity'],
            store: rm['RM Store'],
            userId,
            companyId,
            status: 1,
          })),
          scrapMaterials: payload[key]['Leftover']?.map(left => ({
            itemId: left['Item Id'],
            itemName: itemsMap?.[left['Item Id']]?.itemName,
            uom: uomMap?.[left['UOM']].id,
            quantity: left['Quantity'],
            store: left['Leftover Store'],
            userId,
            companyId,
            status: 1,
          })),
          productionProcess: payload[key]['Production Process']?.map(pp => ({
            processId: processMap?.[pp['Process Name']],
            userId,
            companyId,
            status: 1,
          })),
          additionalCharges: payload[key]['Other Charges']?.map(oc => ({
            chargesName: oc['Charges Name'],
            amount: oc['Amount (INR)'],
            userId,
            companyId,
            status: 1,
          }))
        }
        bomSeriesMap[payload[key]['FG'][0]['BOM Series']] = bomSeriesMap?.[payload[key]['FG'][0]?.['BOM Series']] + 1;
      }
    }

    const entries = Object.entries(validData);

    // 1️⃣ Create all BOMDetails
    const bomDetails = await models.BOMDetails.bulkCreate(
      entries.map(([_, value]) => value.bomDetails),
      { returning: true, transaction }
    );

    // 2️⃣ Prepare master arrays
    const allFinishedGoods = [];
    const allRawMaterials = [];
    const allScrapMaterials = [];
    const allProductionProcess = [];
    const allAdditionalCharges = [];

    bomDetails.forEach((bomDetail, index) => {
      const [, value] = entries[index];

      const {
        finishedGoods = [],
        rawMaterials = [],
        scrapMaterials = [],
        productionProcess = [],
        additionalCharges = []
      } = value;

      finishedGoods.forEach(fg =>
        allFinishedGoods.push({ ...fg, bomId: bomDetail.id })
      );

      rawMaterials.forEach(rm =>
        allRawMaterials.push({ ...rm, bomId: bomDetail.id })
      );

      scrapMaterials.forEach(sm =>
        allScrapMaterials.push({ ...sm, bomId: bomDetail.id })
      );

      productionProcess.forEach(pp =>
        allProductionProcess.push({ ...pp, bomId: bomDetail.id })
      );

      additionalCharges.forEach(ac =>
        allAdditionalCharges.push({ ...ac, bomId: bomDetail.id })
      );
    });

    // 3️⃣ Bulk insert once per table
    await Promise.all([
      allFinishedGoods.length &&
      models.BOMFinishedGoods.bulkCreate(allFinishedGoods, { transaction }),

      allRawMaterials.length &&
      models.BOMRawMaterial.bulkCreate(allRawMaterials, { transaction }),

      allScrapMaterials.length &&
      models.BOMScrapMaterial.bulkCreate(allScrapMaterials, { transaction }),

      allProductionProcess.length &&
      models.BOMProductionProcess.bulkCreate(allProductionProcess, { transaction }),

      allAdditionalCharges.length &&
      models.BOMAdditionalCharges.bulkCreate(allAdditionalCharges, { transaction })
    ]);



    const dataLength = data['FG']?.length;
    const validLength = bomDetails?.length;

    for (const element of bomSeries) {
      if (bomSeriesMap?.[element.prefix] != element.nextNumber) {
        await models.BOMSeries.update({ nextNumber: bomSeriesMap[element.prefix] }, { where: { id: element.id } }, { transaction });
      }
    }

    await transaction.commit();

    return res.status(200).json({
      errorData: dataLength == validLength ? {} : errorData,
      message: dataLength == validLength ? 'BOMs uploaded successfully' : validLength == 0 ? 'All records have errors' : 'BOMs uploaded Successfully. Few rows have errors. We download Those rows.',
    });
  } catch (error) {
    await transaction.rollback();
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
