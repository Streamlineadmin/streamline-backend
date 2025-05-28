const models = require("../models");

async function handleReportColumns(req, res) {
  try {
    const { userId, companyId, columnsData, ip_address, status, documentType } = req.body;

    // Fetch all records for userId and companyId
    if (userId && companyId && !columnsData && !documentType) {
      const records = await models.ReportColumns.findAll({
        where: { userId, companyId },
      });

      return res.status(200).json({
        success: true,
        data: records,
      });
    }

    // Upsert (add or update) record
    if (!userId || !companyId || !documentType) {
      return res.status(400).json({ 
        success: false,
        message: "userId, companyId, and documentType are required for saving preferences.",
      });
    }

    const existingRecord = await models.ReportColumns.findOne({
      where: { userId, companyId, documentType },
    });

    let result;

    if (existingRecord) {
      const updateData = {
        columnsData: columnsData || existingRecord.columnsData,
        ip_address: ip_address || existingRecord.ip_address,
        status: status !== undefined ? status : existingRecord.status,
      };

  console.log("Existing record:", existingRecord.dataValues);
  console.log("Updating with:", updateData);
      result = await existingRecord.update(updateData);
    } else {
      result = await models.ReportColumns.create({
        userId,
        companyId,
        columnsData,
        ip_address,
        status,
        documentType,
      });
    }

    return res.status(200).json({
      success: true,
      data: result,
      message: existingRecord ? "Record updated" : "New record created",
    });
  } catch (error) {
    console.error("Error in handleReportColumns:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

module.exports = {
  handleReportColumns,
};

