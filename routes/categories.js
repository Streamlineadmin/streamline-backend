const express = require('express');
const { Model } = require('sequelize');
const categoriesController = require('../controller/categories.controller');

const router = express.Router();
router.post('/', categoriesController.getCategories);

module.exports = router;