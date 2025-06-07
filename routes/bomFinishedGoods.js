const express = require('express');
const { Model } = require('sequelize');
const bomFinishedGoodsController = require('../controller/bomFinishedGoods.controller');

const router = express.Router();

router.post('/addBOMFinishedGoods', bomFinishedGoodsController.createBOMFinishedGoods);
router.post('/updateBOMFinishedGoods', bomFinishedGoodsController.updateBOMFinishedGood);
router.post('/deleteBOMFinishedGoods', bomFinishedGoodsController.deleteBOMFinishedGood);
router.post('/', bomFinishedGoodsController.getAllBOMFinishedGoods);

module.exports = router;
