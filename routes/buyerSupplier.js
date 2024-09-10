const express = require('express');
const { Model } = require('sequelize');
const buyerSupplierController = require('../controller/buyerSupplier.controller');

const router = express.Router();
router.post('/addBuyerSupplier', buyerSupplierController.addBuyerSupplier);
router.post('/deleteBuyerSupplier', buyerSupplierController.deleteBuyerSupplier);
router.post('/', buyerSupplierController.getBuyerSupplier);

module.exports = router;