const models = require("../models");

function addItemSeries(req, res) {
  models.ItemSeries.findOne({
    where: { prefix: req.body.series, companyId: req.body.companyId },
  })
    .then((itemSeries) => {
      if (itemSeries) {
        return res.status(409).json({
          message: "Item series already exists!",
        });
      } else {
        // Item series not exist, proceed to create
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

        models.ItemSeries.create(series)
          .then((result) => {
            res.status(201).json({
              message: "Item series added successfully",
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

function editItemSeries(req, res) {
  const seriesName = req.body.seriesName;
  const prefix = req.body.series;
  const number = req.body.number;
  const companyId = req.body.companyId;

  const updatedItemSeriesData = {
    seriesName,
    prefix,
    number,
    companyId,
    status: req.body.status || 1,
    ip_address: req.body.ip_address,
    userId: req.body.userId,
  };

  models.ItemSeries.findOne({
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
        models.ItemSeries.update(updatedItemSeriesData, {
          where: { id: req.body.id },
        })
          .then((result) => {
            if (result[0] > 0) {
              res.status(200).json({
                message: "Item series updated successfully",
                post: updatedItemSeriesData,
              });
            } else {
              res.status(404).json({
                message: "Item series not found",
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

function updateLastItemNumber(req, res) {
  const id = req.body.seriesId;
  const nextNumber = req.body.nextNumber;
  const companyId = req.body.companyId;

  const updatedItemSeriesData = { nextNumber };

  models.ItemSeries.findOne({
    where: { companyId, id: { [models.Sequelize.Op.ne]: id } },
  })
    .then((existingSeries) => {
      // Proceed with the update
      models.ItemSeries.update(updatedItemSeriesData, { where: { id: id } })
        .then((result) => {
          if (result[0] > 0) {
            res.status(200).json({
              message: "Next number updated successfully",
              post: updatedItemSeriesData,
            });
          } else {
            res.status(404).json({
              message: "Item series not found",
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

async function deleteItemSeries(req, res) {
  try {
    const deleted = await models.ItemSeries.destroy({ where: { id: req.body.id } });
    res.status(200).json({
      message: deleted ? "Item series deleted successfully" : "Item series not found",
    });
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong, please try again later!",
      error,
    });
  }
}


function getItemSeries(req, res) {
  models.ItemSeries.findAll({
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

async function setDefaultItemSeries(req, res) {
  try {
    await models.ItemSeries.update(
      { default: 0 },
      {
        where: {
          companyId: req.body.companyId,
        },
      }
    );

    await models.ItemSeries.update(
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
  addItemSeries: addItemSeries,
  getItemSeries: getItemSeries,
  editItemSeries: editItemSeries,
  deleteItemSeries: deleteItemSeries,
  updateLastItemNumber: updateLastItemNumber,
  setDefaultItemSeries: setDefaultItemSeries,
};
