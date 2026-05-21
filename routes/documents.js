const express = require('express');
const { Model } = require('sequelize');
const documentsController = require('../controller/documents.controller');
const { upload } = require('../helpers/file-uploader');

const router = express.Router();
router.post('/', documentsController.getDocuments);
router.post('/getDocumentById', documentsController.getDocumentById);
router.post('/fetchCurrentDoc', documentsController.fetchCurrentDoc);
router.post('/createDocument', documentsController.createDocument);
router.post('/discardDocument', documentsController.discardDocument);
router.post('/deleteDocument', documentsController.deleteDocument);
router.post('/getPreviewDocuments', documentsController.getPreviewDocuments);
router.post('/getDocumentItems', documentsController.getDocumentItems);
router.post('/shortCloseTranscation', documentsController.shortCloseTransaction);
router.post('/getSalesDocumentItems', documentsController.getSalesDocumentItems);
router.post('/editDocument', documentsController.editDocument);
router.post('/getServiceChallanItems', documentsController.getServiceChallanItems);
router.post('/approveDocument', documentsController.approveDocument);
router.post('/createEInvoice', documentsController.createEInvoice);
router.post('/createEWayBill', documentsController.createEWayBill);
router.post('/emailDocument', upload.single("pdfBase64"), documentsController.emailDocument);
router.post('/cancelEInvoice', documentsController.cancelEInvoice);
router.post('/getChallanDocumentItems', documentsController.getChallanDocumentItems);
router.post('/createEwayBillFromEInvoice', documentsController.createEwayBillFromEInvoice);

module.exports = router;