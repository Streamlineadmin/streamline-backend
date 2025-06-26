const models = require("../models");

async function addLogTDS(req, res) {
  const { companyId, userId, documents } = req.body;

  const now = new Date().toISOString();
  const toCreate = documents.map((doc) => ({
    companyName: doc.companyName,
    companyId,
    userId,
    documentType: doc.documentType,
    documentNumber: doc.documentNumber,
    tdsPercent: doc.tdsPercent,
    tdsAmount: doc.tdsAmount,
    totalAmountAfterDeduction: doc.totalAmountAfterDeduction,
    createdAt: now,
    updatedAt: now,
    comments: doc.comments || "",
  }));

  try {
    const inserted = await models.logTDS.bulkCreate(toCreate);
    res.status(201).json({ message: "LogTDS records added", data: inserted });
  } catch (error) {
    console.error("Add LogTDS Error:", error);
    res
      .status(500)
      .json({ message: "Failed to add LogTDS", error: error.toString() });
  }
}

async function getAllLogTDS(req, res) {
  try {
    const companyId = req.body.companyId;

    if (!companyId) {
      return res.status(400).json({
        message: "Missing required parameter: companyId",
      });
    }

    const tdsEntries = await models.logTDS.findAll({
      where: { companyId },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({ data: tdsEntries });
  } catch (error) {
    console.error("Error fetching LogTDS entries:", error);
    res.status(500).json({
      message: "Failed to retrieve LogTDS entries",
      error: error.toString(),
    });
  }
}

async function getLogTDSById(req, res) {
    try {
        const id = req.body.id;
        const entry = await models.LogTDS.findByPk(id);
        if (!entry) return res.status(404).json({ message: "LogTDS not found" });
        res.status(200).json({ data: entry });
    } catch (error) {
        res
            .status(500)
            .json({ message: "Error retrieving LogTDS", error: error.toString() });
    }
}

async function updateLogTDS(req, res) {
  try {
    const id = req.body.id;
    const updated = await models.LogTDS.update(
      { ...req.body, updatedAt: new Date().toISOString() },
      { where: { id } }
    );
    if (updated[0] === 0)
      return res.status(404).json({ message: "LogTDS not found" });

    res.status(200).json({ message: "LogTDS updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Update failed", error: error.toString() });
  }
}

// DELETE - By ID
async function deleteLogTDS(req, res) {
  try {
    const id = req.body.id;
    const deleted = await models.LogTDS.destroy({ where: { id } });
    if (!deleted) return res.status(404).json({ message: "LogTDS not found" });

    res.status(200).json({ message: "LogTDS deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed", error: error.toString() });
  }
}

module.exports = {
  addLogTDS,
  getAllLogTDS,
  getLogTDSById,
  updateLogTDS,
  deleteLogTDS,
};
