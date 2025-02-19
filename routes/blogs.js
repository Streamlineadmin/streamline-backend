const express = require('express');
const { Model } = require('sequelize');
const blogController = require('../controller/blog.controller');

const router = express.Router();
router.post('/addBlog', blogController.addBlog);
router.post('/editBlog', blogController.editBlog);
router.post('/deleteBlog', blogController.deleteBlog);
router.get('/categories', blogController.getblogscategories);
router.get('/:id', blogController.getblogsById);
router.get('/', blogController.getblogs);

module.exports = router;