const express = require('express');
const bomDetailsController = require('../controller/bomDetails.controller');

const router = express.Router();
router.post('/', bomDetailsController.getBOMDetails);
router.post('/createBOMDetails', bomDetailsController.createBOMDetails);
router.post('/updateBOMDetails', bomDetailsController.updateBOMDetails);
router.post('/deleteBOMDetails', bomDetailsController.deleteBOMDetails);
router.post('/getBOMById', bomDetailsController.getBOMById);
router.post('/getAllBOMs', bomDetailsController.getAllBOMs);
router.post('/getAllItemsBoms', bomDetailsController.getAllItemsBoms);
router.post('/deleteBillOfMaterials', bomDetailsController.deleteBillOfMaterials);
router.post('/editBillOfMaterials', bomDetailsController.editBillOfMaterials);

module.exports = router;