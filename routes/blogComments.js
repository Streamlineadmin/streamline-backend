const express = require("express");
const { Model } = require("sequelize");
const blogCommentsController = require('../controller/blogComments.conroller')

const router = express.Router();
router.post("/addBlogComments", blogCommentsController.addBlogComments);
router.post("/editBlogComments", blogCommentsController.editBlogComment);
router.post("/deleteBlogComment", blogCommentsController.deleteBlogComment);
router.get("/:id", blogCommentsController.getBlogCommentById);
router.post("/", blogCommentsController.getBlogComments);
module.exports = router;
