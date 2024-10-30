const express = require('express');
const fileController = require('../controller/file.controller'); // Rename to fileController for general use
const fileUploader = require('../helpers/file-uploader'); // Rename to fileUploader

const router = express.Router();

router.post('/uploads', fileUploader.upload.single('file'), fileController.upload); // Accept any file type

module.exports = router;
