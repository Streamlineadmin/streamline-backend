const models = require("../models");
const bomseries = require("../models/bomseries");

function addBOMSeries(req, res) {
  models.BOMSeries.findOne({
    where: { prefix: req.body.series, companyId: req.body.companyId },
  })
    .then((bomseries) => {
      if (bomseries) {
        return res.status(409).json({
          message: "BOM series already exists!",
        });
      } else {
        // BOM series not exist, proceed to create
        const series = {
          seriesName: req.body.seriesName,
          prefix: req.body.series,
          number: req.body.number,
          companyId: req.body.companyId,
          default: req.body.default,
          nextNumber: req.body.nextNumber,
          status: 1,
          ip_address: req.body.ip_address,
          userId: req.body.userId,
        };

        models.BOMSeries.create(series)
          .then((result) => {
            res.status(201).json({
              message: "BOM series added successfully",
              post: result,
            });
          })
          .catch((error) => {
            res.status(500).json({
              message: "Something went wrong, please try again later!",
              error: error,
            });
          });
      }
    })
    .catch((error) => {
      res.status(500).json({
        message: "Something went wrong, please try again later!",
        error: error,
      });
    });
}

function editBOMSeries(req, res) {
  const seriesName = req.body.seriesName;
  const prefix = req.body.series;
  const number = req.body.number;
  const companyId = req.body.companyId;

  const updatedBOMSeriesData = {
    seriesName,
    prefix,
    number,
    companyId,
    status: req.body.status || 1,
    ip_address: req.body.ip_address,
    userId: req.body.userId,
  };

  models.BOMSeries.findOne({
    where: {
      seriesName: req.body.seriesName,
      companyId,
      id: { [models.Sequelize.Op.ne]: req.body.id },
    },
  })
    .then((existingSeries) => {
      if (existingSeries) {
        // If a series with the same name already exists for the company
        return res.status(409).json({
          message: "Series name already exists for this company!",
        });
      } else {
        // Proceed with the update
        models.BOMSeries.update(updatedBOMSeriesData, {
          where: { id: req.body.id },
        })
          .then((result) => {
            if (result[0] > 0) {
              res.status(200).json({
                message: "BOM series updated successfully",
                post: updatedBOMSeriesData,
              });
            } else {
              res.status(404).json({
                message: "BOM series not found",
              });
            }
          })
          .catch((error) => {
            res.status(500).json({
              message: "Something went wrong, please try again later!",
              error: error.message || error,
            });
          });
      }
    })
    .catch((error) => {
      res.status(500).json({
        message: "Something went wrong, please try again later!",
        error: error.message || error,
      });
    });
}

function updateLastBOMNumber(req, res) {
  const id = req.body.seriesId;
  const nextNumber = req.body.nextNumber;
  const companyId = req.body.companyId;

  const updatedBOMSeriesData = { nextNumber };

  models.BOMSeries.findOne({
    where: { companyId, id: { [models.Sequelize.Op.ne]: id } },
  })
    .then((existingSeries) => {
      // Proceed with the update
      models.BOMSeries.update(updatedBOMSeriesData, { where: { id: id } })
        .then((result) => {
          if (result[0] > 0) {
            res.status(200).json({
              message: "Next number updated successfully",
              post: updatedBOMSeriesData,
            });
          } else {
            res.status(404).json({
              message: "BOM series not found",
            });
          }
        })
        .catch((error) => {
          res.status(500).json({
            message: "Something went wrong, please try again later!",
            error: error.message || error,
          });
        });
    })
    .catch((error) => {
      res.status(500).json({
        message: "Something went wrong, please try again later!",
        error: error.message || error,
      });
    });
}

function deleteBOMSeries(req, res) {
  const id = req.body.id;

  models.BOMSeries.destroy({ where: { id: id } })
    .then((result) => {
      if (result) {
        res.status(200).json({
          message: "BOM series deleted successfully",
        });
      } else {
        res.status(200).json({
          message: "BOM series not found",
        });
      }
    })
    .catch((error) => {
      res.status(500).json({
        message: "Something went wrong, please try again later!",
        error: error,
      });
    });
}

function getBOMSeries(req, res) {
  models.BOMSeries.findAll({
    where: {
      companyId: req.body.companyId,
    },
  })
    .then((result) => {
      if (!result || result.length === 0) {
        return res.status(200).json([]);
      }
      res.status(200).json(result);
    })
    .catch((error) => {
      console.error("Error fetching blogs:", error);
      res.status(500).json({
        message: "Something went wrong, please try again later!",
      });
    });
}

async function setDefaultBOMSeries(req, res) {
  try {
    await models.BOMSeries.update(
      { default: 0 },
      {
        where: {
          companyId: req.body.companyId,
        },
      }
    );

    await models.BOMSeries.update(
      { default: 1 },
      {
        where: {
          id: req.body.id,
        },
      }
    );
    res.status(200).json({ message: "Series Successfully set as Default." });
  } catch (error) {
    res.status(500).json({ message: "Something Went Wrong." });
  }
}

module.exports = {
  addBOMSeries: addBOMSeries,
  getBOMSeries: getBOMSeries,
  editBOMSeries: editBOMSeries,
  deleteBOMSeries: deleteBOMSeries,
  updateLastBOMNumber: updateLastBOMNumber,
  setDefaultBOMSeries: setDefaultBOMSeries,
};
