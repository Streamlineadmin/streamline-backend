const express = require('express');
const emailCredentialController  = require('../controller/emailCredential.controller');

const router = express.Router();

router.post('/createEmailCredential', emailCredentialController.createEmailCredential);
router.post('/getEmailCredential', emailCredentialController.getEmailCredential);
router.post('/updateEmailCredential', emailCredentialController.updateEmailCredential);
router.post('/deleteEmailCredential', emailCredentialController.deleteEmailCredentials);

module.exports = router;