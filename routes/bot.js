const express = require('express');
const { Model } = require('sequelize');
const botController = require('../controller/LLMBot.controller');

const router = express.Router();
router.post('/trainModel', botController.trainModel);
router.post('/', botController.predict);

module.exports = router;