const express = require("express");
const settingsController = require("../controller/settings.controller");

const router = express.Router();

router.post("/updateSetting", settingsController.updateSetting);
router.post("/getSetting", settingsController.getSetting);

module.exports = router;
