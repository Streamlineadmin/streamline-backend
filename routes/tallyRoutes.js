const express = require('express');
const { Model } = require('sequelize');
const tallyController = require('../controller/tallyLedger.controller');

const router = express.Router();
router.post('/ledgers', tallyController.createLedger);

module.exports = router;