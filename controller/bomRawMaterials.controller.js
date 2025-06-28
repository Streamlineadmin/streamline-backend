const models = require("../models");

async function createBOMRawMaterials(req, res) {
  try {
    const { bomId, rawMaterials, userId, companyId } = req.body;

    if (!bomId || !Array.isArray(rawMaterials) || rawMaterials.length === 0) {
      return res
        .status(400)
        .json({ message: "bomId and raw materials are required." });
    }

    const payload = rawMaterials.map((item) => ({
      bomId,
      itemId: item.itemId,
      itemName: item.itemName,
      uom: item.uom,
      quantity: item.quantity,
      store: item.store,
      userId: userId || null,
      companyId: companyId || null,
      status: item.status,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const createdItems = await models.BOMRawMaterial.bulkCreate(payload);

    return res.status(201).json({
      message: "Raw materials created successfully.",
      data: createdItems,
    });
  } catch (error) {
    console.error("Create Error:", error);
    return res.status(500).json({
      message: "Failed to create raw materials.",
      error: error.message,
    });
  }
}

async function getAllBOMRawMaterials(req, res) {
  try {
    const { bomId } = req.body;

    if (!bomId) {
      return res.status(400).json({ message: "bomId is required." });
    }

    const rawMaterials = await models.BOMRawMaterial.findAll({
      where: { bomId },
    });

    return res.status(200).json({
      message: "Raw materials retrieved successfully.",
      data: rawMaterials,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong!",
      error: error.message,
    });
  }
}

async function updateBOMRawMaterial(req, res) {
  try {
    const { bomId, rawMaterials, userId, companyId, status } = req.body;

    if (!bomId || !Array.isArray(rawMaterials)) {
      return res.status(400).json({ message: "Missing required data" });
    }

    const existing = await models.BOMRawMaterial.findAll({
      where: { bomId },
      attributes: ["id"],
    });
    const existingIds = existing.map((row) => row.id);
    const incomingIds = rawMaterials
      .filter((item) => item.id)
      .map((item) => Number(item.id));

    const toUpdate = rawMaterials.filter((item) => item.id);
    const toCreate = rawMaterials.filter((item) => !item.id);
    const toDelete = existingIds.filter((id) => !incomingIds.includes(id));

    if (toDelete.length) {
      await models.BOMRawMaterial.destroy({
        where: { id: toDelete },
      });
    }

    await Promise.all(
      toUpdate.map((item) =>
        models.BOMRawMaterial.update(
          {
            itemId: item.itemId,
            itemName: item.itemName,
            uom: item.UOM,
            quantity: item.quantity,
            store: item.store,
            costAllocation: item.costAllocation,
            status,
            updatedAt: new Date(),
          },
          { where: { id: item.id } }
        )
      )
    );

    if (toCreate.length) {
      const payload = toCreate.map((item) => ({
        bomId,
        itemId: item.itemId,
        itemName: item.itemName,
        uom: item.UOM,
        quantity: item.quantity,
        store: item.store,
        costAllocation: item.costAllocation,
        userId,
        companyId,
        status,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await models.BOMRawMaterial.bulkCreate(payload);
    }

    return res.status(200).json({
      message: "Raw materials synchronized successfully",
    });
  } catch (error) {
    console.error("Upsert Error:", error);
    return res.status(500).json({
      message: "Something went wrong!",
      error: error.message,
    });
  }
}

// DELETE - Delete a raw material by ID
async function deleteBOMRawMaterial(req, res) {
  try {
    const { id } = req.params;

    const deletedCount = await models.BOMRawMaterial.destroy({
      where: { id },
    });

    if (!deletedCount) {
      return res.status(404).json({ message: "Raw material not found." });
    }

    return res.status(200).json({
      message: "Raw material deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Error:", error);
    return res.status(500).json({
      message: "Failed to delete raw material.",
      error: error.message,
    });
  }
}

async function linkBOM(req, res) {
  try {
    const { data, companyId } = req.body;
    const finishedGood = await models.BOMFinishedGoods.findOne({
      where: {
        companyId: Number(companyId),
        itemId: data.itemId
      },
      order: [['createdAt', 'DESC']],
      raw: true
    });
    const rawMaterials = await models.BOMRawMaterial.findAll({
      where: {
        bomId: finishedGood.bomId
      },
      raw: true
    });

    const payload = rawMaterials.map(item => {
      return {
        bomId: data.bomId,
        itemId: item.itemId,
        itemName: item.itemName,
        uom: item.uom,
        quantity: (data.quantity * (item.quantity / finishedGood.quantity)),
        store: item.store,
        userId: item.userId || null,
        companyId: companyId || null,
        status: 1,
        parentId: data.id
      }
    });
    await models.BOMRawMaterial.bulkCreate(payload);
    res.status(201).json({ message: 'Bom Linked Successfully' });
  } catch (error) {
    console.log(error);
    res.status(401).json({ message: 'Error while linking BOM.' });
  }
}

async function unlinkBOM(req, res) {
  try {
    const { data, companyId } = req.body;

    if (!data?.id || !companyId) {
      return res.status(400).json({ message: "Material ID and companyId are required" });
    }

    // Step 1: Fetch all raw materials of the company
    const allMaterials = await models.BOMRawMaterial.findAll({
      where: { companyId },
      raw: true
    });

    // Step 2: Build a map of parentId => children IDs
    const childMap = {};
    allMaterials.forEach(material => {
      if (material.parentId) {
        if (!childMap[material.parentId]) childMap[material.parentId] = [];
        childMap[material.parentId].push(material.id);
      }
    });

    // Step 3: Traverse from data.id, collect all descendant IDs (exclude data.id itself)
    const idsToDelete = [];
    const stack = childMap[data.id] || [];

    while (stack.length) {
      const currentId = stack.pop();
      idsToDelete.push(currentId);

      if (childMap[currentId]) {
        stack.push(...childMap[currentId]);
      }
    }

    // Step 4: Delete all collected children
    if (idsToDelete.length) {
      await models.BOMRawMaterial.destroy({
        where: { id: idsToDelete }
      });
    }

    return res.status(200).json({
      message: "BOM children unlinked successfully"
    });

  } catch (error) {
    console.error("Unlink BOM Error:", error);
    return res.status(500).json({ message: "Error while unlinking BOM." });
  }
}



module.exports = {
  createBOMRawMaterials,
  getAllBOMRawMaterials,
  updateBOMRawMaterial,
  deleteBOMRawMaterial,
  linkBOM,
  unlinkBOM
};
