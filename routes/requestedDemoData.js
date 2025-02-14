const express = require("express");
const router = express.Router();

const requestedDemoDataController = require("../controller/requestDemo.controller");

router.post("/addContactUs", requestedDemoDataController.addRequestedDemoData); 
router.post("/", requestedDemoDataController.getAllRequestedDemos);

module.exports = router;
