const express = require('express');
const { Model } = require('sequelize');
const itemController = require('../controller/items.controller');

const router = express.Router();
router.post('/addItem', itemController.addItem);
router.post('/editItem', itemController.editItem);
router.post('/deleteItem', itemController.deleteItem);
router.post('/', itemController.getItems);

module.exports = router;