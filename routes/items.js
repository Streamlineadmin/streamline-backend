const express = require('express');
const { Model } = require('sequelize');
const itemController = require('../controller/items.controller');
const { upload } = require('../helpers/file-uploader');

const router = express.Router();
router.post('/addItem', itemController.addItem);
router.post('/editItem', itemController.editItem);
router.post('/deleteItem', itemController.deleteItem);
router.post('/', itemController.getItems);
router.post('/deleteItems', itemController.deleteItems);
router.post('/addBulkItem', upload.single('file'), itemController.addBulkItem);
router.post('/editBulkItem', upload.single('file'), itemController.bulkEditItems);
router.post('/stockReconcilation', upload.single('file'), itemController.stockReconcilation);

module.exports = router;