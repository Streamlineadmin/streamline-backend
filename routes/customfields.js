const express = require("express");
const router = express.Router();

const customfieldController = require("../controller/customfields.controller");

router.post("/addCustomFields", customfieldController.addCustomfields);
router.post("/getCustomFields", customfieldController.getCustomfields);
router.post("/deleteCustomFields", customfieldController.deleteCustomfields);

module.exports = router;
