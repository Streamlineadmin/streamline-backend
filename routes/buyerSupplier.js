const express = require('express');
const { Model } = require('sequelize');
const buyerSupplierController = require('../controller/buyerSupplier.controller');
const { upload } = require('../helpers/file-uploader');

const router = express.Router();
router.post('/addBuyerSupplier', buyerSupplierController.addBuyerSupplier);
router.post('/deleteBuyerSupplier', buyerSupplierController.deleteBuyerSupplier);
router.post('/bulkDeleteBuyerSupplier', buyerSupplierController.bulkDeleteBuyerSupplier);
router.post('/editBuyerSupplier', buyerSupplierController.editBuyerSupplier);
router.post('/', buyerSupplierController.getBuyerSupplier);
router.post('/addBulkCompany', upload.single('file'), buyerSupplierController.bulkUploadBuyerSuppliers);
router.post('/getCompanyDetailsByGstNumber', buyerSupplierController.getCompanyDetailsByGstNumber);

module.exports = router;