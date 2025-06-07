const express = require('express');
const router = express.Router();

const productionProcessController = require('../controller/productionProcess.controller');

router.post('/createProductionProcess', productionProcessController.createProductionProcess);
router.post('/', productionProcessController.getAllProductionProcesses);
router.get('/getProductionProcessById', productionProcessController.getProductionProcessById);
router.post('/updateProductionProcess', productionProcessController.updateProductionProcess);
router.post('/deleteProductionProcess', productionProcessController.deleteProductionProcess);

module.exports = router;