const models = require("../models");

async function addCustomfields(req, res) {
  try {
    const { fieldName, required, type, companyId, userId, defaultValue } = req.body;
    if (!fieldName || !type) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newField = await models.CustomFields.create({
      fieldName,
      type,
      defaultValue: defaultValue || '',
      companyId: Number(companyId),
      userId: Number(userId)
    });

    return res.status(201).json({
      message: "CustomField Created successfully.",
      data: newField,
    });
  } catch (error) {
    console.error("Error submitting query:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getCustomfields(req, res) {
  try {
    const { companyId } = req.body;

    const data = await models.CustomFields.findAll({
      companyId
    });

    return res.status(200).json({
      message: "CustomField Fetched successfully.",
      data
    });
  } catch (error) {
    console.error("Error submitting query:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  addCustomfields: addCustomfields,
  getCustomfields: getCustomfields
};
