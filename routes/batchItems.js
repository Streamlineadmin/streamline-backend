const express = require('express');
const batchItemsController = require('../controller/batchitems.controller');

const router = express.Router();
router.post('/createBatches', batchItemsController.createBatchItems);
router.post('/getBatches', batchItemsController.getBatchItems);
router.post('/getBatchByItems', batchItemsController.getBatchByItems);
router.post('/updateBatchByItems', batchItemsController.updateBatchByItems);

module.exports = router;