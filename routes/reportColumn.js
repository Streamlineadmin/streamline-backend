const express = require("express");

const reportColumnController = require("../controller/reportcolumns.controller");

const router = express.Router();
router.post("/columnslPrefrence", reportColumnController.handleReportColumns);
module.exports = router;
