const express = require('express');
const { Model } = require('sequelize');
const documentSeriesController = require('../controller/documentSeries.controller');

const router = express.Router();
router.post('/addDocumentSeries', documentSeriesController.addDocumentSeries);
router.post('/editDocumentSeries', documentSeriesController.editDocumentSeries);
router.post('/deleteDocumentSeries', documentSeriesController.deleteDocumentSeries);
router.post('/updateLastDocumentNumber', documentSeriesController.updateLastDocumentNumber);
router.post('/', documentSeriesController.getDocumentSeries);
router.post('/setAsDefault', documentSeriesController.setAsDefault);

module.exports = router;