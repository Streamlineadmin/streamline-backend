const express = require('express');
const { Model } = require('sequelize');
const logisticDetailsController = require('../controller/logisticDetails.controller');

const router = express.Router();

router.post('/addLogisticDetails', logisticDetailsController.addLogisticDetails);
router.post('/editLogisticDetails', logisticDetailsController.editLogisticDetails);
router.post('/deleteLogisticDetails', logisticDetailsController.deleteLogisticDetails);
router.post('/', logisticDetailsController.getLogisticDetails);

module.exports = router;
