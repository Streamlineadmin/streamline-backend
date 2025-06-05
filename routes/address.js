const express = require("express");
const { Model } = require("sequelize");
const addressController = require("../controller/address.controller");

const router = express.Router();
router.post("/addAddress", addressController.addAddress);
router.post("/editAddress", addressController.editAddress);
router.post("/deleteAddress", addressController.deleteAddress);
router.post("/setDefaultAddress", addressController.setDefaultAddress);
router.get("/:id", addressController.getAddressById);
router.post("/", addressController.getAddresses);
module.exports = router;
