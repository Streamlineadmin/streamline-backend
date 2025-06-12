const express = require("express");
const router = express.Router();

const bomSeriesController = require("../controller/bomSeries.controller");

router.post("/addBOMSeries", bomSeriesController.addBOMSeries);
router.post("/editBOMSeries", bomSeriesController.editBOMSeries);
router.post("/deleteBOMSeries", bomSeriesController.deleteBOMSeries);
router.post("/updateLastBOMNumber", bomSeriesController.updateLastBOMNumber);
router.post("/", bomSeriesController.getBOMSeries);
router.post("/setDefaultBOMSeries", bomSeriesController.setDefaultBOMSeries);

module.exports = router;
