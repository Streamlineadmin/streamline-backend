const express = require('express');
const { Model } = require('sequelize');
const documentsController = require('../controller/documents.controller');

const router = express.Router();
router.post('/', documentsController.getDocuments);

module.exports = router;