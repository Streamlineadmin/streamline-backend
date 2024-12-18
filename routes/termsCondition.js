const express = require('express');
const { Model } = require('sequelize');
const termsConditionController = require('../controller/termsCondition.controller');

const router = express.Router();

router.post('/addTermsCondition', termsConditionController.addTermsCondition); 
router.post('/editTermsCondition', termsConditionController.editTermsCondition); 
router.post('/deleteTermsCondition', termsConditionController.deleteTermsCondition); 
router.post('/getTermsCondition', termsConditionController.getTermsCondition);

module.exports = router;

