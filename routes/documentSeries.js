const express = require('express');
const { Model } = require('sequelize');
const documentSeriesController = require('../controller/documentSeries.controller');

const router = express.Router();
router.post('/addDocumentSeries', documentSeriesController.addDocumentSeries);
router.post('/editDocumentSeries', documentSeriesController.editDocumentSeries);
router.post('/deleteDocumentSeries', documentSeriesController.deleteDocumentSeries);
router.post('/', documentSeriesController.getDocumentSeries);

module.exports = router;