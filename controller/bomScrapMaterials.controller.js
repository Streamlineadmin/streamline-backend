const models = require("../models");

async function createBOMScrapMaterials(req, res) {
  try {
    const { bomId, scrapLogs, userId, companyId } = req.body;

    if (!scrapLogs || !bomId || !Array.isArray(scrapLogs) || scrapLogs.length === 0) {
      return res.status(400).json({ message: "bomId and scrap logs materials are required." });
    }

    const payload = scrapLogs.map((item) => ({
      bomId,
      itemId: item.itemId,
      itemName: item.itemName,
      uom: item.uom,
      quantity: item.quantity,
      store: item.store,
      costAllocationPercent: item.costAllocation,
      userId,
      companyId,
      status: item.status,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const createdItems = await models.BOMScrapMaterial.bulkCreate(payload);

    res.status(201).json({
      message: "Scrap materials created successfully",
      data: createdItems,
    });
  } catch (error) {
    console.error("Create Error:", error);
    res
      .status(500)
      .json({ message: "Something went wrong!", error: error.message });
  }
}

// GET - Get all scrap materials
async function getAllBOMScrapMaterials(req, res) {
  try {
    const { bomId } = req.body;
    if (!bomId) {
      return res.status(400).json({ message: "bomId is required." });
    }
    const scrapMaterials = await models.BOMScrapMaterial.findAll({
      where: { bomId },
    });
    res.status(200).json({
      message: "Scrap materials retrieved successfully",
      data: scrapMaterials,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong!", error: error.message });
  }
}

// UPDATE - Update scrap material by ID
async function updateBOMScrapMaterial(req, res) {
  try {
    const { id } = req.params;

    const updated = await models.BOMScrapMaterial.update(req.body, {
      where: { id },
    });

    if (updated[0] === 0) {
      return res
        .status(404)
        .json({ message: "Scrap material not found or no changes made" });
    }

    res.status(200).json({ message: "Scrap material updated successfully" });
  } catch (error) {
    console.error("Update Error:", error);
    res
      .status(500)
      .json({ message: "Something went wrong!", error: error.message });
  }
}

// DELETE - Delete scrap material by ID
async function deleteBOMScrapMaterial(req, res) {
  try {
    const { id } = req.params;

    const deleted = await models.BOMScrapMaterial.destroy({
      where: { id },
    });

    if (!deleted) {
      return res.status(404).json({ message: "Scrap material not found" });
    }

    res.status(200).json({ message: "Scrap material deleted successfully" });
  } catch (error) {
    console.error("Delete Error:", error);
    res
      .status(500)
      .json({ message: "Something went wrong!", error: error.message });
  }
}

module.exports = {
  createBOMScrapMaterials,
  getAllBOMScrapMaterials,
  updateBOMScrapMaterial,
  deleteBOMScrapMaterial,
};
