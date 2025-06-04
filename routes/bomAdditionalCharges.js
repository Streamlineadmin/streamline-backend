const express = require('express');
const bomAdditionalChargesController = require('../controller/bomAdditionalCharges.controller');

const router = express.Router();
router.post('/', bomAdditionalChargesController.getAllBOMAdditionalCharges);
router.post('/createBOMAdditionalCharges', bomAdditionalChargesController.createBOMAdditionalCharges);
router.post('/updateBOMAdditionalCharges', bomAdditionalChargesController.updateBOMAdditionalCharge);
router.post('/deleteBOMAdditionalCharges', bomAdditionalChargesController.deleteBOMAdditionalCharge);

module.exports = router;