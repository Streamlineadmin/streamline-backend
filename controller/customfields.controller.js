const models = require("../models");

async function addCustomfields(req, res) {
  try {
    const
      {
        fieldName,
        required,
        type,
        companyId,
        userId,
        defaultValue,
        documentType,
        options,
        showByDefault
      } = req.body;
    if (!fieldName || !type || !documentType) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newField = await models.CustomFields.create({
      fieldName,
      type,
      defaultValue: defaultValue || '',
      companyId: Number(companyId),
      userId: Number(userId),
      documentType,
      required: required || false,
      options: options || [],
      showByDefault: showByDefault || false
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
      where: {
        companyId
      }
    });

    return res.status(200).json({
      message: "CustomField Fetched successfully.",
      data
    });
  } catch (error) {
    console.error("Error in Fetching Custom Field.", error);
    return res.status(500).json({ message: "Server error" });
  }
}

async function deleteCustomfields(req, res) {
  try {
    const { id } = req.body;
    const data = await models.CustomFields.findOne({
      where: {
        id
      }
    });
    if (!data) return res.status(404).json({ message: 'Custom Field Not Found.' });
    await models.CustomFields.destroy({
      where: {
        id
      }
    });
    return res.status(200).json({
      message: "CustomField Deleted successfully."
    });
  } catch (error) {
    console.error("Error in Deleteing Custom Field.", error);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  addCustomfields: addCustomfields,
  getCustomfields: getCustomfields,
  deleteCustomfields: deleteCustomfields
};
