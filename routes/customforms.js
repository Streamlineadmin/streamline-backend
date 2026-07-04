const express = require("express");
const router = express.Router();

const customformController = require("../controller/customforms.controller");

router.post("/addCustomForm", customformController.addCustomform);
router.post("/getCustomForms", customformController.getCustomforms);
router.post("/deleteCustomForm", customformController.deleteCustomform);
router.post("/editCustomForm", customformController.editCustomform);

module.exports = router;
