const express = require('express');
const logPaymentsController = require('../controller/logPayments.controller');

const router = express.Router();

router.post('/addLogPayments', logPaymentsController.addLogPayment);
router.post('/', logPaymentsController.getAllLogPayments);
router.post('/:id', logPaymentsController.getLogPaymentById);
router.post('/updateLogPayments', logPaymentsController.updateLogPayment);
router.delete('/deleteLogPayment', logPaymentsController.deleteLogPayment);

module.exports = router;
