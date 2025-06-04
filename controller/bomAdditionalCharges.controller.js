const models = require("../models");

// CREATE - Bulk insert additional charges
async function createBOMAdditionalCharges(req, res) {
  try {
    const { charges, userId, companyId } = req.body;

    if (!charges || !Array.isArray(charges) || charges.length === 0) {
      return res
        .status(400)
        .json({ message: "No additional charges provided" });
    }

    const payload = charges.map((item) => ({
      chargesName: item.chargesName,
      amount: item.amount || 0,
      userId,
      companyId,
      status: item.status,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const createdCharges = await models.BOMAdditionalCharges.bulkCreate(
      payload
    );

    res.status(201).json({
      message: "Additional charges created successfully",
      data: createdCharges,
    });
  } catch (error) {
    console.error("Create Error:", error);
    res
      .status(500)
      .json({ message: "Something went wrong!", error: error.message });
  }
}

// GET - Get all additional charges
async function getAllBOMAdditionalCharges(req, res) {
  try {
    const additionalCharges = await models.BOMAdditionalCharges.findAll();
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

// UPDATE - Update additional charge by ID
async function updateBOMAdditionalCharge(req, res) {
  try {
    const { id } = req.params;

    const updated = await models.BOMAdditionalCharges.update(req.body, {
      where: { id },
    });

    if (updated[0] === 0) {
      return res
        .status(404)
        .json({ message: "Additional charge not found or no changes made" });
    }

    res.status(200).json({ message: "Additional charge updated successfully" });
  } catch (error) {
    console.error("Update Error:", error);
    res
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
