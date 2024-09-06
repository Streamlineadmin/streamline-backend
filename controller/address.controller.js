const models = require("../models");

function addAddress(req, res) {
  const store = {
    companyId: req.body.companyId,
    ip_address: req.body.ip_address,
    addressLineOne: req.body.addressLineOne,
    addressLineTwo: req.body.addressLineTwo,
    pincode: req.body.pinCode,
    addressType: req.body.addressType,
    city: req.body.city,
    state: req.body.state,
    country: req.body.country,
    status: 1,
  };

  models.Addresses.create(store)
    .then((result) => {
      res.status(201).json({
        message: "Address added successfully",
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

function editAddress(req, res) {
  const addressId = req.body.addressId;

  // updatedAddressData
  const updatedStoreData = {
    companyId: req.body.companyId,
    ip_address: req.body.ip_address,
    addressLineOne: req.body.addressLineOne,
    addressLineTwo: req.body.addressLineTwo,
    pincode: req.body.pinCode,
    city: req.body.city,
    state: req.body.state,
    country: req.body.country,
    addressType: req.body.addressType,
    status: req.body.status || 1, 
  };

  models.Addresses.update(updatedStoreData, { where: { id: addressId } })
    .then((result) => {
      if (result[0] > 0) {
        res.status(200).json({
          message: "Address updated successfully",
          post: updatedStoreData,
        });
      } else {
        res.status(200).json({
          message: "Something went wrong, please try again later!",
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

function deleteAddress(req, res) {
  const storeId = req.body.storeId; // Assuming the store ID is passed as a URL parameter

  models.Addresses.destroy({ where: { id: storeId } })
    .then((result) => {
      if (result) {
        res.status(200).json({
          message: "Address deleted successfully",
        });
      } else {
        res.status(200).json({
          message: "Something went wrong, please try again later!",
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

function getAddressById(req, res) {
  const id = req.params.id;

  models.Addresses.findByPk(id)
    .then((result) => {
      res.status(200).json(result);
    })
    .catch((error) => {
      res.status(500).json({
        message: "something went wrong, please try again later!",
      });
    });
}

function getAddresses(req, res) {
  models.Addresses.findAll({
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
  addAddress: addAddress,
  getAddressById: getAddressById,
  getAddresses: getAddresses,
  editAddress: editAddress,
  deleteAddress: deleteAddress,
};
