const express = require('express');
const { Model } = require('sequelize');
const categoriesController = require('../controller/categories.controller');

const router = express.Router();
router.post('/', categoriesController.getCategories);
router.post('/addCategory', categoriesController.addCategory);
router.post('/editCategory', categoriesController.editCategory);
router.post('/deleteCategory', categoriesController.deleteCategory);
router.post('/addBulkCategory', categoriesController.addMultipleCategory);

module.exports = router;