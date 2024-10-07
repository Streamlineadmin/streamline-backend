const express = require('express');
const imageController = require('../controller/image.controller');
const imageUploader = require('../helpers/image-uploader');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();

router.post('/uploads', imageUploader.upload.single('image'), imageController.upload);

module.exports = router;