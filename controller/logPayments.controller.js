const { documentTypes } = require("../helpers/document-type");
const models = require("../models");

async function addLogPayment(req, res) {
  const {
    companyId,
    paymentDate,
    paymentMode,
    bankName,
    transactionNumber,
    comments,
    documents,
  } = req.body;

  const now = new Date().toISOString();
  const toCreate = documents.map((doc) => ({
    companyId,
    companyName: doc.companyName,
    documentType: doc.documentType,
    documentNumber: doc.documentNumber,
    createdAt: doc.creationDate || now,
    updatedAt: now,
    dueDate: doc.dueDate,
    amountPaid: doc.amountPaid,
    logPayment: doc.logPaymentAmount,
    comments: doc.comment,
    markPaid: doc.markPaid,
    paymentDate,
    paymentMode,
    bankName,
    transactionNumber,
  }));

  for (const element of documents) {
    if (element.documentType === documentTypes.invoice) {
      const invoice = await models.Documents.findOne({
        where: {
          companyId,
          documentNumber: element.documentNumber
        }
      });
      if (invoice) {
        await invoice.update({
          amountPaid: Number(invoice.amountPaid || 0) + Number(element.logPaymentAmount)
        });
      }
    }
  }

  try {
    const newPayments = await models.LogPayment.bulkCreate(toCreate);
    res.status(201).json({
      message: "Log payments added successfully",
      data: newPayments,
    });
  } catch (error) {
    console.error("Error adding log payments:", error);
    res.status(500).json({
      message: "Failed to add log payments",
      error: error.toString(),
    });
  }
}

async function getAllLogPayments(req, res) {
  try {
    const companyId = req.body.companyId;

    if (!companyId) {
      return res.status(400).json({
        message: "Missing required parameter: companyId",
      });
    }

    const payments = await models.LogPayment.findAll({
      where: { companyId },
      order: [["createdAt", "DESC"]], // optional: newest first
    });

    res.status(200).json({ data: payments });
  } catch (error) {
    console.error("Error fetching log payments:", error);
    res.status(500).json({
      message: "Failed to retrieve log payments",
      error: error.toString(),
    });
  }
}


// Get one by ID
async function getLogPaymentById(req, res) {
  try {
    const payment = await models.LogPayment.findByPk(req.body.id);
    if (!payment)
      return res.status(404).json({ message: "Log payment not found" });

    res.status(200).json({ data: payment });
  } catch (error) {
    console.error("Error fetching log payment:", error);
    res.status(500).json({
      message: "Failed to retrieve log payment",
      error,
    });
  }
}

// Update
async function updateLogPayment(req, res) {
  try {
    const [updated] = await models.LogPayment.update(req.body, {
      where: { id: req.body.id },
    });

    if (!updated)
      return res.status(404).json({
        message: "Log payment not found or no changes made",
      });

    const updatedPayment = await models.LogPayment.findByPk(req.body.id);
    res.status(200).json({
      message: "Log payment updated",
      data: updatedPayment,
    });
  } catch (error) {
    console.error("Error updating log payment:", error);
    res.status(500).json({
      message: "Failed to update log payment",
      error,
    });
  }
}

async function deleteLogPayment(req, res) {
  try {
    const deleted = await models.LogPayment.destroy({
      where: { id: req.body.id },
    });

    if (!deleted)
      return res.status(404).json({ message: "Log payment not found" });

    res.status(200).json({ message: "Log payment deleted" });
  } catch (error) {
    console.error("Error deleting log payment:", error);
    res.status(500).json({
      message: "Failed to delete log payment",
      error,
    });
  }
}

module.exports = {
  addLogPayment,
  getAllLogPayments,
  getLogPaymentById,
  updateLogPayment,
  deleteLogPayment,
};
