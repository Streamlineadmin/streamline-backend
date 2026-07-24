const express = require("express");
const router = express.Router();

const labelController = require("../controller/label.controller");

router.post("/addLabel", labelController.addLabel);
router.post("/getLabels", labelController.getLabels);
router.post("/editLabel", labelController.editLabel);
router.post("/deleteLabel", labelController.deleteLabel);
router.post("/assignLabels", labelController.assignLabels);
router.post("/removeLabel", labelController.removeLabel);

module.exports = router;
