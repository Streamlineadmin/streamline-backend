const express = require('express');
const router = express.Router();
const { amyCompletions } = require("../controller/amy.controller");
const { amyReport } = require("../controller/amy.controller");
router.post("/completions", amyCompletions);
router.post('/report', amyReport);

module.exports = router;