const express = require("express");
const router = express.Router();

const customfieldController = require("../controller/customfields.controller");

router.post("/addCustomFields", customfieldController.addCustomfields);
router.post("/getCustomFields", customfieldController.getCustomfields);
router.post("/deleteCustomFields", customfieldController.deleteCustomfields);
router.post("/editPermissions", customfieldController.editPermissions);
router.post("/editCustomField", customfieldController.editCustomField);

module.exports = router;
