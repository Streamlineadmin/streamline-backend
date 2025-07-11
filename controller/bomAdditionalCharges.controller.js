const models = require("../models");

// CREATE - Bulk insert additional charges
async function createBOMAdditionalCharges(req, res) {
  try {
    const { bomId, charges, userId, companyId } = req.body;

    if (!bomId || !charges || !Array.isArray(charges)) {
      return res.status(400).json({ message: "No additional charges provided" });
    }

    const validCharges = charges.filter(
      (item) => item.chargesName?.trim() && item.amount != null
    );

    let createdCharges = [];

    // Insert valid rows only
    if (validCharges.length > 0) {
      const payload = validCharges.map((item) => ({
        bomId,
        chargesName: item.chargesName,
        amount: item.amount,
        userId,
        companyId,
        status: item.status,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      createdCharges = await models.BOMAdditionalCharges.bulkCreate(payload);
    }

    const isFinalSave = charges.some((item) => item.status == 1);
    const isDraftSave = charges.every((item) => item.status == 0);

    if (isFinalSave || isDraftSave) {
      const updateStatusPayload = { status: isFinalSave ? 1 : 0 };

      const updatePromises = [
        models.BOMRawMaterial.update(updateStatusPayload, { where: { bomId } }),
        models.BOMFinishedGoods.update(updateStatusPayload, { where: { bomId } }),
        models.BOMProductionProcess.update(updateStatusPayload, { where: { bomId } }),
        models.BOMDetails.update(updateStatusPayload, { where: { id: bomId } }),
      ];

      const [chargesCount, scrapCount] = await Promise.all([
        models.BOMAdditionalCharges.count({ where: { bomId } }),
        models.BOMScrapMaterial.count({ where: { bomId } }),
      ]);

      if (chargesCount > 0) {
        updatePromises.push(
          models.BOMAdditionalCharges.update(updateStatusPayload, { where: { bomId } })
        );
      }

      if (scrapCount > 0) {
        updatePromises.push(
          models.BOMScrapMaterial.update(updateStatusPayload, { where: { bomId } })
        );
      }

      await Promise.all(updatePromises);
    }

    return res.status(201).json({
      message:
        validCharges.length > 0
          ? "Additional charges created successfully, BOM created successfully."
          : "BOM created successfully.",
      data: createdCharges,
    });
  } catch (error) {
    console.error("Create Error:", error);
    res.status(500).json({
      message: "Something went wrong!",
      error: error.message,
    });
  }
}

async function getAllBOMAdditionalCharges(req, res) {
  try {
    const { bomId } = req.body;

    if (!bomId) {
      return res.status(400).json({ message: "bomId is required." });
    }
    const additionalCharges = await models.BOMAdditionalCharges.findAll({
      where: { bomId },
    });
    res.status(200).json({
      message: "Additional charges retrieved successfully",
      data: additionalCharges,
    });
  } catch (error) {
    console.error("Get Error:", error);
    res
      .status(500)
      .json({ message: "Something went wrong!", error: error.message });
  }
}

async function updateBOMAdditionalCharge(req, res) {
  try {
    const { bomId, companyId, userId, charges } = req.body;

    if (!bomId || !Array.isArray(charges)) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    // Fetch existing charges
    const existing = await models.BOMAdditionalCharges.findAll({
      where: { bomId },
      attributes: ["id"],
    });

    const existingIds = existing.map((row) => row.id);
    const incomingIds = charges.filter((item) => item.id).map((item) => Number(item.id));

    const toUpdate = charges.filter((item) => item.id);
    const toCreate = charges.filter((item) => !item.id);
    const toDelete = existingIds.filter((id) => !incomingIds.includes(id));

    // Delete removed charges
    if (toDelete.length) {
      await models.BOMAdditionalCharges.destroy({
        where: { id: toDelete },
      });
    }

    // Update existing
    await Promise.all(
      toUpdate.map((item) =>
        models.BOMAdditionalCharges.update(
          {
            chargesName: item.chargesName,
            amount: item.amount,
            status: item.status,
            updatedBy: userId,
            updatedAt: new Date(),
          },
          { where: { id: item.id } }
        )
      )
    );

    // Create new
    if (toCreate.length) {
      const payload = toCreate.map((item) => ({
        bomId,
        companyId,
        userId,
        chargesName: item.chargesName,
        amount: item.amount,
        status: item.status,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await models.BOMAdditionalCharges.bulkCreate(payload);
    }

    const isFinalSave = charges.some((item) => item.status == 1);
    const isDraftSave = charges.every((item) => item.status == 0);

    if (isFinalSave || isDraftSave) {
      const updateStatusPayload = { status: isFinalSave ? 1 : 0 };

      await Promise.all([
        models.BOMRawMaterial.update(updateStatusPayload, { where: { bomId } }),
        models.BOMFinishedGoods.update(updateStatusPayload, { where: { bomId } }),
        models.BOMScrapMaterial.update(updateStatusPayload, { where: { bomId } }),
        models.BOMProductionProcess.update(updateStatusPayload, { where: { bomId } }),
        models.BOMAdditionalCharges.update(updateStatusPayload, { where: { bomId } }),
        models.BOMDetails.update(updateStatusPayload, { where: { id: bomId } }),
      ]);
    }

    return res.status(200).json({
      message: "Additional charges synchronized successfully",
    });
  } catch (error) {
    console.error("Upsert Error:", error);
    return res
      .status(500)
      .json({ message: "Something went wrong!", error: error.message });
  }
}


// DELETE - Delete additional charge by ID
async function deleteBOMAdditionalCharge(req, res) {
  try {
    const { id } = req.params;

    const deleted = await models.BOMAdditionalCharges.destroy({
      where: { id },
    });

    if (!deleted) {
      return res.status(404).json({ message: "Additional charge not found" });
    }

    res.status(200).json({ message: "Additional charge deleted successfully" });
  } catch (error) {
    console.error("Delete Error:", error);
    res
      .status(500)
      .json({ message: "Something went wrong!", error: error.message });
  }
}

module.exports = {
  createBOMAdditionalCharges,
  getAllBOMAdditionalCharges,
  updateBOMAdditionalCharge,
  deleteBOMAdditionalCharge,
};
