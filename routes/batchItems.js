const express = require('express');
const batchItemsController = require('../controller/batchitems.controller');

const router = express.Router();
router.post('/getBatches', batchItemsController.getBatchItems);

module.exports = router;