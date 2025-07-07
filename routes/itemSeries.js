const express = require("express");
const router = express.Router();

const itemSeriesController = require("../controller/itemSeries.controller");

router.post("/addItemSeries", itemSeriesController.addItemSeries);
router.post("/editItemSeries", itemSeriesController.editItemSeries);
router.post("/deleteItemSeries", itemSeriesController.deleteItemSeries);
router.post("/updateLastItemNumber", itemSeriesController.updateLastItemNumber);
router.post("/", itemSeriesController.getItemSeries);
router.post("/setDefaultItemSeries", itemSeriesController.setDefaultItemSeries);

module.exports = router;
