const express = require('express');
const { Model } = require('sequelize');
const accountDetailsController = require('../controller/accountDetails.controller');

const router = express.Router();
router.post('/addTeam', accountDetailsController.addAccountDetails);
router.post('/editTeam', accountDetailsController.editAccountDetails);
router.post('/deleteTeam', accountDetailsController.deleteAccountDetails);
router.post('/', accountDetailsController.getAccountDetails);

module.exports = router;