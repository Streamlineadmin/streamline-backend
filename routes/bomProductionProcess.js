const express = require('express');

const bomProductionProcessController = require('../controller/bomProductionProcess.controller');

const router = express.Router();

router.post('/', bomProductionProcessController.getBOMProductionProcesses);
router.post('/createBOMProductionProcess', bomProductionProcessController.createBOMProductionProcess);
router.post('/updateBOMProductionProcess', bomProductionProcessController.updateBOMProductionProcess);
router.post('/deleteBOMProductionProcess', bomProductionProcessController.deleteBOMProductionProcess);

module.exports = router;
