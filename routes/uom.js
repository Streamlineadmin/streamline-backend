const express = require('express');
const { Model } = require('sequelize');
const uomController = require('../controller/uom.controller');

const router = express.Router();
router.post('/addUOM', uomController.addUOM);
router.post('/editUOM', uomController.editUOM);
router.post('/deleteUOM', uomController.deleteUOM);
router.post('/', uomController.getUOMs);

module.exports = router;