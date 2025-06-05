const express = require('express');
const { Model } = require('sequelize');
const transporterDetailsController = require('../controller/transporterDetails.controller');

const router = express.Router();

router.post('/addTransporterDetails', transporterDetailsController.addTransporterDetails);
router.post('/editTransporterDetails', transporterDetailsController.editTransporterDetails);
router.post('/deleteTransporterDetails', transporterDetailsController.deleteTransporterDetails);
router.post('/getTransporterDetails', transporterDetailsController.getTransporterDetails);

module.exports = router;
