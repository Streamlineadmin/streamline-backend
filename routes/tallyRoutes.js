const express = require('express');
const { Model } = require('sequelize');
const tallyController = require('../controller/tallyLedger.controller');

const router = express.Router();
router.post('/createLedgers', tallyController.createLedger);
router.get('/ledgers', tallyController.getAllLedgers);
router.post('/connect', tallyController.connectToTally);

module.exports = router;