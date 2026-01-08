const express = require("express");
const router = express.Router();

const customfieldController = require("../controller/customfields.controller");
const { upload } = require("../helpers/file-uploader");

router.post("/addCustomFields", upload.single("defaultValue"), customfieldController.addCustomfields);
router.post("/getCustomFields", customfieldController.getCustomfields);
router.post("/deleteCustomFields", customfieldController.deleteCustomfields);
router.post("/editPermissions", customfieldController.editPermissions);
router.post("/editCustomField", upload.single("defaultValue"), customfieldController.editCustomField);

module.exports = router;
