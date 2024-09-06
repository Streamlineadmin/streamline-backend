const express = require("express");
const { Model } = require("sequelize");
const blogCommentsController = require('../controller/blogComments.conroller')

const router = express.Router();
router.post("/addBlogComments", blogCommentsController.addBlogComments);
router.post("/getCommentstoApprove", blogCommentsController.getCommentstoApprove);
router.post("/deleteBlogComment", blogCommentsController.deleteBlogComment); 
router.post("/", blogCommentsController.getBlogComments);
module.exports = router;
