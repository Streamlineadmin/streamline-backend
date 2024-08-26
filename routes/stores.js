const express = require("express");
const { Model } = require("sequelize");
const storeController = require("../controller/store.controller");

const router = express.Router();
router.post("/addStore", storeController.addStore);
router.post("/editStore", storeController.editStore);
router.post("/deleteStore", storeController.deleteStore);
router.get("/:id", storeController.getStoresById);
router.post("/", storeController.getStores);
module.exports = router;
