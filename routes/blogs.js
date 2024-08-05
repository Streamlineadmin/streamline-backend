const express = require('express');
const { Model } = require('sequelize');
const blogController = require('../controller/blog.controller');

const router = express.Router();
router.post('/addBlog', blogController.addBlog);
router.get('/:id', blogController.getblogsById);
router.get('/', blogController.getblogs);

module.exports = router;