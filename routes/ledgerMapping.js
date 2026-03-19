const express = require('express');
const ledgerMappingController = require('../controller/ledgerMapping.controller');

const router = express.Router();

router.post('/create', ledgerMappingController.createLedgerMapping);
router.post('/getAll', ledgerMappingController.getAllLedgerMapping);
router.post('/update', ledgerMappingController.updateLedgerMapping);
router.post('/delete', ledgerMappingController.deleteLedgerMapping);

module.exports = router;
