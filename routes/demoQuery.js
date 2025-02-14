const express = require("express");
const router = express.Router();

const demoQueryController = require("../controller/demoQuery.controller");

router.post("/addDemoQuery", demoQueryController.addDemoQuery); 
router.post("/", demoQueryController.getDemoQuery);

module.exports = router;
