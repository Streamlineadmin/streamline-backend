const express = require('express');
const updateImageController = require('../controller/updateImage.controller'); 

const router = express.Router();

router.post('/updateImage', updateImageController.updateImage);

module.exports = router;
