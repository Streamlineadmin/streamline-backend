const express = require('express');
const { Model } = require('sequelize');
const paymentTermsController  = require('../controller/paymentTerms.controller');

const router = express.Router();
router.post('/addPaymentTerms', paymentTermsController.addPaymentTerms);
router.post('/editPaymentTerms', paymentTermsController.editPaymentTerms);
router.post('/deletePaymentTerms', paymentTermsController.deletePaymentTerms); 
router.post('/', paymentTermsController.getPaymentTerms);

module.exports = router;