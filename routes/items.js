const express = require('express');
const { Model } = require('sequelize');
const itemController = require('../controller/items.controller');
const { upload } = require('../helpers/file-uploader');

const router = express.Router();
router.post('/addItem', upload.array('imageUrl'), itemController.addItem);
router.post('/editItem', upload.array('imageUrl'), itemController.editItem);
router.post('/deleteItem', itemController.deleteItem);
router.post('/', itemController.getItems);
router.post('/getPaginatedItems', itemController.getPaginatedItems);
router.post('/deleteItems', itemController.deleteItems);
router.post('/addBulkItem', upload.single('file'), itemController.addBulkItem);
router.post('/editBulkItem', upload.single('file'), itemController.bulkEditItems);
router.post('/stockReconcilation', upload.single('file'), itemController.stockReconcilation);
router.post('/addbulkAlternateUnits', upload.single('file'), itemController.bulkUploadAlternateUnit);
router.post('/bulkStockUpdate', upload.single('file'), itemController.bulkStockUpdate);

module.exports = router;