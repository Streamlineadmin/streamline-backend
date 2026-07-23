const express = require('express');
const itemMappingController = require('../controller/itemMapping.controller');

const router = express.Router();

router.post('/create', itemMappingController.createItemMapping);
router.post('/getAll', itemMappingController.getAllItemMapping);
router.post('/update', itemMappingController.updateItemMapping);
router.post('/delete', itemMappingController.deleteItemMapping);

module.exports = router;
