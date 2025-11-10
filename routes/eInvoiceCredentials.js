const express = require('express');
const eInvoiceCredentialController  = require('../controller/eInvoiceCredentials.controller');

const router = express.Router();

router.post('/createCredential', eInvoiceCredentialController.createCredential);
router.post('/getCredential', eInvoiceCredentialController.getCredential);
router.post('/updateCredential', eInvoiceCredentialController.updateCredential);
router.post('/deleteCredential', eInvoiceCredentialController.deleteCredentials);

module.exports = router;