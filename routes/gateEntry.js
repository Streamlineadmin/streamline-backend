const express = require('express');
const gateEntryController  = require('../controller/gateEntry.controller');

const router = express.Router();
router.post('/createGateEntry', gateEntryController.createGateEntry);
router.get('/getAllGateEntries', gateEntryController.getAllGateEntries);
router.post('/updateGateEntry', gateEntryController.updateGateEntry);
router.post('/getGateEntriesById', gateEntryController.getGateEntriesById);

module.exports = router;