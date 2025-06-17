const express = require('express');
const productionController = require('../controller/production.controller');

const router = express.Router();
router.post('/startProduction', productionController.startProduction);
router.post('/getProductions', productionController.getProductions);
router.post('/getProductionById', productionController.getProductionById);
router.post('/issueRawMaterial', productionController.issueRawMaterial);
router.post('/updateProcess', productionController.updateProcess);
router.post('/updateCost', productionController.updateCost);
router.post('/updateScrapLogs', productionController.updateScrapLogs);
router.post('/saveFinishedGoods', productionController.saveFinishedGoods);
router.post('/updateProductionStatus', productionController.updateProductionStatus);
router.post('/saveProduction', productionController.saveProduction);

module.exports = router;