const express = require('express');
const logTDSController = require('../controller/logTDS.controller');

const router = express.Router();

router.post('/addLogTDS', logTDSController.addLogTDS);
router.post('/', logTDSController.getAllLogTDS);
router.post('/:id', logTDSController.getLogTDSById);
router.post('/updateLogTDS', logTDSController.updateLogTDS);
router.delete('/deleteLogTDS', logTDSController.deleteLogTDS);

module.exports = router;
