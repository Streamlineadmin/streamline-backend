const models = require("../models");

async function createBOMFinishedGoods(req, res) {
  try {
    const { bomId, finishedGoods, userId, companyId, status } = req.body;

    if (
      !bomId ||
      !finishedGoods ||
      !Array.isArray(finishedGoods) ||
      finishedGoods.length === 0
    ) {
      return res.status(400).json({ message: "Missing required data" });
    }

    const payload = finishedGoods.map((item) => ({
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

    const createdItems = await models.BOMFinishedGoods.bulkCreate(payload);

    res.status(201).json({
      message: "Finished goods added successfully",
      data: createdItems,
    });
  } catch (error) {
    console.error("Create Error:", error);
    res
      .status(500)
      .json({ message: "Something went wrong!", error: error.message });
  }
}

async function getAllBOMFinishedGoods(req, res) {
  try {
    const { bomId } = req.body;

    if (!bomId) {
      return res.status(400).json({ message: "bomId is required" });
    }

    const data = await models.BOMFinishedGoods.findAll({
      where: { bomId },
    });

    res.status(200).json({ message: "Retrieved successfully", data });
  } catch (error) {
    console.error("Get Error:", error);
    res
      .status(500)
      .json({ message: "Something went wrong!", error: error.message });
  }
}

async function updateBOMFinishedGood(req, res) {
  try {
    const { bomId, finishedGoods, userId, companyId, status } = req.body;

    if (!bomId || !finishedGoods || !Array.isArray(finishedGoods)) {
      return res.status(400).json({ message: "Missing required data" });
    }
    const existing = await models.BOMFinishedGoods.findAll({
      where: { bomId },
      attributes: ["id"],
    });
    const existingIds = existing.map((row) => row.id);
    const incomingIds = finishedGoods
      .filter((item) => item.id)
      .map((item) => Number(item.id));

    const toUpdate = finishedGoods.filter((item) => item.id);
    const toCreate = finishedGoods.filter((item) => !item.id);
    const toDelete = existingIds.filter((id) => !incomingIds.includes(id));
    if (toDelete.length) {
      await models.BOMFinishedGoods.destroy({
        where: { id: toDelete },
      });
    }
    await Promise.all(
      toUpdate.map((item) =>
        models.BOMFinishedGoods.update(
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
      await models.BOMFinishedGoods.bulkCreate(payload);
    }

    return res.status(200).json({
      message: "Finished goods synchronized successfully",
    });
  } catch (error) {
    console.error("Upsert Error:", error);
    return res
      .status(500)
      .json({ message: "Something went wrong!", error: error.message });
  }
}

// DELETE
async function deleteBOMFinishedGood(req, res) {
  try {
    const { id } = req.params;
    const deleted = await models.BOMFinishedGoods.destroy({ where: { id } });

    if (!deleted) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Delete Error:", error);
    res
      .status(500)
      .json({ message: "Something went wrong!", error: error.message });
  }
}

module.exports = {
  createBOMFinishedGoods,
  getAllBOMFinishedGoods,
  updateBOMFinishedGood,
  deleteBOMFinishedGood,
};
