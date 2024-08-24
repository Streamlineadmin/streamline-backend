const models = require("../models");

function addStore(req, res) {
  const store = {
    companyId: req.body.companyId,
    name: req.body.name,
    description: req.body.description,
    ip_address: req.body.ip_address,
    status: 1,
  };

  models.Stores.create(store)
    .then((result) => {
      res.status(201).json({
        message: "Store added successfully",
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

function editStore(req, res) {
  const storeId = req.body.storeId;

  const updatedStoreData = {
    companyId: req.body.companyId,
    name: req.body.name,
    description: req.body.description,
    ip_address: req.body.ip_address,
    status: req.body.status || 1, // Optional, defaults to 1 if not provided
  };

  models.Stores.update(updatedStoreData, { where: { id: storeId } })
    .then((result) => {
      if (result[0] > 0) {
        res.status(200).json({
          message: "Store updated successfully",
          post: updatedStoreData,
        });
      } else {
        res.status(200).json({
          message: "Store not found",
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

function deleteStore(req, res) {
  const storeId = req.body.storeId; // Assuming the store ID is passed as a URL parameter

  models.Stores.destroy({ where: { id: storeId } })
    .then((result) => {
      if (result) {
        res.status(200).json({
          message: "Store deleted successfully",
        });
      } else {
        res.status(200).json({
          message: "Store not found",
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

function getStoresById(req, res) {
  const id = req.params.id;

  models.Stores.findByPk(id)
    .then((result) => {
      res.status(200).json(result);
    })
    .catch((error) => {
      res.status(500).json({
        message: "something went wrong, please try again later!",
      });
    });
}

function getStores(req, res) {
  models.Stores.findAll({
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
      console.error("Error fetching stores:", error);
      res.status(500).json({
        message: "Something went wrong, please try again later!",
      });
    });
}

module.exports = {
  addStore: addStore,
  getStoresById: getStoresById,
  getStores: getStores,
  editStore: editStore,
  deleteStore: deleteStore,
};
