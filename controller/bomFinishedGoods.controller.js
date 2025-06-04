const models = require("../models");

// CREATE
async function createBOMFinishedGoods(req, res) {
  try {
    const { finishedGoods, userId, companyId } = req.body;

    if (
      !finishedGoods ||
      !Array.isArray(finishedGoods) ||
      finishedGoods.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "No finished goods data provided" });
    }

    const payload = finishedGoods.map((item) => ({
      itemId: item.itemId,
      itemName: item.itemName,
      uom: item.UOM,
      quantity: item.quantity,
      store: item.store,
      costAllocation: item.costAllocation,
      userId,
      companyId,
      status: "active",
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
    const data = await models.BOMFinishedGoods.findAll();
    res.status(200).json({ message: "Retrieved successfully", data });
  } catch (error) {
    console.error("Get Error:", error);
    res
      .status(500)
      .json({ message: "Something went wrong!", error: error.message });
  }
}

// UPDATE (single or multiple)
async function updateBOMFinishedGood(req, res) {
  try {
    const { id } = req.params;
    const updated = await models.BOMFinishedGoods.update(req.body, {
      where: { id },
    });

    if (updated[0] === 0) {
      return res.status(404).json({ message: "Item not found or no changes" });
    }

    res.status(200).json({ message: "Updated successfully" });
  } catch (error) {
    console.error("Update Error:", error);
    res
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
