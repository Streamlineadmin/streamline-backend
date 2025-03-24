const express = require('express');
const { Model } = require('sequelize');
const documentsController = require('../controller/documents.controller');

const router = express.Router();
router.post('/', documentsController.getDocuments);
router.post('/getDocumentById', documentsController.getDocumentById);
router.post('/createDocument', documentsController.createDocument);
router.post('/discardDocument', documentsController.discardDocument);
router.post('/deleteDocument', documentsController.deleteDocument);
router.post('/getPreviewDocuments', documentsController.getPreviewDocuments);

module.exports = router;