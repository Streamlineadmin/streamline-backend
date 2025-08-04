const express = require("express");
const reportController = require("../controller/reports.controller");

const router = express.Router();
router.post('/getReports', reportController.getReports);

module.exports = router;