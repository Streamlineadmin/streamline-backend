const express = require('express');
const packagingMasterController = require('../controller/packagingMaster.controller');

const router = express.Router();
router.post('/addPackagingMaster', packagingMasterController.addPackagingMaster);
router.post('/editPackagingMaster', packagingMasterController.editPackagingMaster);
router.post('/deletePackagingMaster', packagingMasterController.deletePackagingMaster);
router.post('/', packagingMasterController.getPackagingMasters);

module.exports = router;
