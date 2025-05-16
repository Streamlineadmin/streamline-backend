const express = require("express");

const reportColumnController = require("../controller/reportcolumns.controller");

const router = express.Router();
router.post("/addReportColumns", reportColumnController.addReportColumn);
router.post("/editReportColumns", reportColumnController.updateReportColumn);
router.post("/deleteReportColumns", reportColumnController.deleteReportColumn);
router.post("/", reportColumnController.getReportColumn);

module.exports = router;
