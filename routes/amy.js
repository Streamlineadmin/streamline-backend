const express = require('express');
const router = express.Router();
const { amyCompletions } = require("../controller/amy.controller");
router.post("/completions", amyCompletions);

module.exports = router;