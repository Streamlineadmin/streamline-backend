const express = require('express');
const bomDetailsController = require('../controller/bomDetails.controller');

const router = express.Router();
router.post('/', bomDetailsController.getBOMDetails);
router.post('/createBOMDetails', bomDetailsController.createBOMDetails);
router.post('/updateBOMDetails', bomDetailsController.updateBOMDetails);
router.post('/deleteBOMDetails', bomDetailsController.deleteBOMDetails);

module.exports = router;