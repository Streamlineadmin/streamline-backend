const models = require("../models");

function addStore(req, res) {
  const store = {
    companyId: req.body.companyId,
    storeName: req.body.storeName, 
    ip_address: req.body.ip_address,
    addressLineOne: req.body.addressLineOne,
    addressLineTwo: req.body.addressLineTwo,
    pinCode: req.body.pinCode,
    city: req.body.city,
    state: req.body.state,
    country: req.body.country,
    status: 1,
  };

  models.Store.create(store)
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
    storeName: req.body.storeName, 
    ip_address: req.body.ip_address,
    addressLineOne: req.body.addressLineOne,
    addressLineTwo: req.body.addressLineTwo,
    pinCode: req.body.pinCode,
    city: req.body.city,
    state: req.body.state,
    country: req.body.country,
    status: req.body.status || 1, 
  };

  models.Store.update(updatedStoreData, { where: { id: storeId } })
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

  models.Store.destroy({ where: { id: storeId } })
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

  models.Store.findByPk(id)
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
  models.Store.findAll({
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
        message: "Something went wrong, please try again later! its wrong",
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
