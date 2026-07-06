const { isValidJSON } = require("../helpers/add-level");
const models = require("../models");

async function addCustomform(req, res) {
  try {
    const { formName, description, companyId, userId, fields } = req.body;

    if (!formName || !companyId) {
      return res.status(400).json({ message: "Form name and companyId are required" });
    }

    const newForm = await models.CustomForms.create({
      formName,
      description: description || '',
      companyId: Number(companyId),
      userId: Number(userId),
      status: 1,
      fields: isValidJSON(fields) || fields || []
    });

    return res.status(201).json({
      message: "Custom Form created successfully.",
      data: newForm,
    });
  } catch (error) {
    console.error("Error creating custom form:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getCustomforms(req, res) {
  try {
    const { companyId } = req.body;

    const data = await models.CustomForms.findAll({
      where: {
        companyId
      },
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      message: "Custom Forms fetched successfully.",
      data
    });
  } catch (error) {
    console.error("Error in fetching custom forms:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

async function deleteCustomform(req, res) {
  try {
    const { id } = req.body;
    const data = await models.CustomForms.findOne({
      where: {
        id
      }
    });
    if (!data) return res.status(404).json({ message: 'Custom Form not found.' });
    await models.CustomForms.destroy({
      where: {
        id
      }
    });
    return res.status(200).json({
      message: "Custom Form deleted successfully."
    });
  } catch (error) {
    console.error("Error in deleting custom form:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

async function editCustomform(req, res) {
  try {
    const { id, formName, description, fields } = req.body;

    const customForm = await models.CustomForms.findByPk(id);
    if (!customForm) {
      return res.status(404).json({ message: 'Custom Form not found.' });
    }

    await customForm.update({
      formName: formName !== undefined ? formName : customForm.formName,
      description: description !== undefined ? description : customForm.description,
      fields: fields !== undefined ? (isValidJSON(fields) || fields) : customForm.fields
    });

    return res.status(200).json({
      message: "Custom Form updated successfully.",
      data: customForm
    });
  } catch (error) {
    console.error("Error in updating custom form:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  addCustomform,
  getCustomforms,
  deleteCustomform,
  editCustomform
};
