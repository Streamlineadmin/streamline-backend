const express = require("express");
const columnsController = require("../controller/showHideController");

const router = express.Router();
router.post("/addColumns", columnsController.addColumns);
router.post("/getColumns", columnsController.getAllColumns);
router.post("/editColumns", columnsController.editColumns);
router.post("/deleteColumns", columnsController.deleteColumns);

module.exports = router;
