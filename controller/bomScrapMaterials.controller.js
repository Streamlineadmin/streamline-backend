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

async function updateBOMScrapMaterial(req, res) {
  try {
    const { bomId, scrapLogs, userId, companyId } = req.body;

    if (!bomId || !Array.isArray(scrapLogs)) {
      return res.status(400).json({ message: "Missing required data" });
    }

    const existing = await models.BOMScrapMaterial.findAll({
      where: { bomId },
      attributes: ["id"],
    });

    const existingIds = existing.map((row) => row.id);
    const incomingIds = scrapLogs
      .filter((item) => item.id)
      .map((item) => Number(item.id));

    const toUpdate = scrapLogs.filter((item) => item.id);
    const toCreate = scrapLogs.filter((item) => !item.id);
    const toDelete = existingIds.filter((id) => !incomingIds.includes(id));

    // DELETE
    if (toDelete.length) {
      await models.BOMScrapMaterial.destroy({
        where: { id: toDelete },
      });
    }

    // UPDATE
    await Promise.all(
      toUpdate.map((item) =>
        models.BOMScrapMaterial.update(
          {
            itemId: item.itemId,
            itemName: item.itemName,
            uom: item.uom,
            quantity: item.quantity,
            store: item.store,
            costAllocationPercent: item.costAllocation,
            status: item.status,
            updatedAt: new Date(),
          },
          { where: { id: item.id } }
        )
      )
    );

    // CREATE
    if (toCreate.length) {
      const payload = toCreate.map((item) => ({
        bomId,
        itemId: item.itemId,
        itemName: item.itemName,
        uom: item.uom,
        quantity: item.quantity,
        store: item.store,
        costAllocation: item.costAllocation,
        status: item.status,
        companyId,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await models.BOMScrapMaterial.bulkCreate(payload);
    }

    return res.status(200).json({
      message: "Scrap materials synchronized successfully",
    });
  } catch (error) {
    console.error("Update Error:", error);
    return res.status(500).json({
      message: "Something went wrong!",
      error: error.message,
    });
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
