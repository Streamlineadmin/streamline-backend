const express = require('express');
const { Model } = require('sequelize');
const accountDetailsController = require('../controller/accountDetails.controller');

const router = express.Router();
router.post('/addAccountDetails', accountDetailsController.addAccountDetails);
router.post('/editAccountDetails', accountDetailsController.editAccountDetails);
router.post('/deleteAccountDetails', accountDetailsController.deleteAccountDetails);
router.post('/', accountDetailsController.getAccountDetails);

module.exports = router;