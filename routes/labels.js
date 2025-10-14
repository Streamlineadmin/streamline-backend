const express = require("express");
const router = express.Router();

const labelController = require("../controller/label.controller");

router.post("/addLabel", labelController.addLabel);
router.post("/getLabels", labelController.getLabels);
router.post("/assignLabels", labelController.assignLabels);


module.exports = router;
