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

// UPDATE - Update a raw material by ID
async function updateBOMRawMaterial(req, res) {
  try {
    const { id } = req.params;

    const [updatedCount] = await models.BOMRawMaterial.update(req.body, {
      where: { id },
    });

    if (updatedCount === 0) {
      return res.status(404).json({
        message: "Raw material not found or no changes made.",
      });
    }

    return res.status(200).json({
      message: "Raw material updated successfully.",
    });
  } catch (error) {
    console.error("Update Error:", error);
    return res.status(500).json({
      message: "Failed to update raw material.",
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

module.exports = {
  createBOMRawMaterials,
  getAllBOMRawMaterials,
  updateBOMRawMaterial,
  deleteBOMRawMaterial,
};
