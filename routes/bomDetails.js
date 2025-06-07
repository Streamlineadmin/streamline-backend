const express = require('express');
const bomDetailsController = require('../controller/bomDetails.controller');

const router = express.Router();
router.post('/', bomDetailsController.getBOMDetails);
router.post('/createBOMDetails', bomDetailsController.createBOMDetails);
router.post('/updateBOMDetails', bomDetailsController.updateBOMDetails);
router.post('/deleteBOMDetails', bomDetailsController.deleteBOMDetails);
router.post('/getBOMById', bomDetailsController.getBOMById);
router.post('/getAllBOMs', bomDetailsController.getAllBOMs);

module.exports = router;