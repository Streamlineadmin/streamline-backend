const models = require("../models");
const { Op } = require("sequelize");

// Add a new ReportColumn
function addReportColumn(req, res) {
  const { userId, companyId, columnsData, ip_address, documentType } = req.body;

  models.ReportColumns.findOne({
    where: {
      userId,
      companyId,
      documentType,
    },
  })
    .then((existing) => {
      if (existing) {
        return res.status(409).json({
          message:
            "Report column configuration already exists for this user, company, and document type!",
        });
      } else {
        const newData = {
          userId,
          companyId,
          columnsData,
          ip_address,
          documentType,
          status: 1,
        };

        models.ReportColumns.create(newData)
          .then((result) => {
            res.status(201).json({
              message: "Report column added successfully",
              post: result,
            });
          })
          .catch((error) => {
            res.status(500).json({
              message: "Something went wrong, please try again later!",
              error,
            });
          });
      }
    })
    .catch((error) => {
      res.status(500).json({
        message: "Something went wrong, please try again later!",
        error,
      });
    });
}

// Edit/update existing ReportColumn
function updateReportColumn(req, res) {
  const {
    id,
    userId,
    companyId,
    columnsData,
    ip_address,
    status,
    documentType,
  } = req.body;

  if (!id) {
    return res.status(400).json({ message: "Report column ID is required" });
  }

  models.ReportColumns.findOne({
    where: {
      userId,
      companyId,
      documentType,
      id: { [Op.ne]: id },
    },
  })
    .then((conflict) => {
      if (conflict) {
        return res.status(409).json({
          message:
            "Another report column config already exists for this user, company, and document type!",
        });
      } else {
        const updatedData = {
          columnsData,
          ip_address,
          status: status || 1,
          documentType,
        };

        models.ReportColumns.update(updatedData, { where: { id } })
          .then((result) => {
            if (result[0] > 0) {
              res.status(200).json({
                message: "Report column updated successfully",
                post: { id, ...updatedData },
              });
            } else {
              res.status(404).json({ message: "Report column not found" });
            }
          })
          .catch((error) => {
            res.status(500).json({
              message: "Something went wrong, please try again later!",
              error,
            });
          });
      }
    })
    .catch((error) => {
      res.status(500).json({
        message: "Something went wrong, please try again later!",
        error,
      });
    });
}

// Get report columns by company, user, and optionally documentType
function getReportColumn(req, res) {
  const { companyId, userId, documentType } = req.body;

  if (!companyId || !userId) {
    return res
      .status(400)
      .json({ message: "companyId and userId are required" });
  }

  const whereClause = { companyId, userId };
  if (documentType) {
    whereClause.documentType = documentType;
  }

  models.ReportColumns.findAll({
    where: whereClause,
  })
    .then((result) => {
      if (!result || result.length === 0) {
        return res.status(200).json([]);
      }
      res.status(200).json(result);
    })
    .catch((error) => {
      res.status(500).json({
        message: "Something went wrong, please try again later!",
        error,
      });
    });
}

// Delete report column
function deleteReportColumn(req, res) {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ message: "Report column ID is required" });
  }

  models.ReportColumns.destroy({ where: { id } })
    .then((result) => {
      if (result) {
        res.status(200).json({ message: "Report column deleted successfully" });
      } else {
        res.status(404).json({ message: "Report column not found" });
      }
    })
    .catch((error) => {
      res.status(500).json({
        message: "Something went wrong, please try again later!",
        error,
      });
    });
}

module.exports = {
  addReportColumn: addReportColumn,
  updateReportColumn: updateReportColumn,
  getReportColumn: getReportColumn,
  deleteReportColumn: deleteReportColumn,
};
