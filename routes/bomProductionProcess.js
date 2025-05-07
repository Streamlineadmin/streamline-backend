const express = require('express');

const bomProductionProcessController = require('../controller/bomProductionsProcess.controller');

const router = express.Router();

router.post('/', bomProductionProcessController.getBOMProductionProcesses);
router.post('/createBOMProductionProcess', bomProductionProcessController.createBOMProductionProcess);
router.post('/updateBOMProductionProcess', bomProductionProcessController.updateBOMProductionProcess);
router.post('/deleteBOMProductionProcess', bomProductionProcessController.deleteBOMProductionProcess);

module.exports = router;
