const express = require('express');
const { Model } = require('sequelize');
const mailerController = require('../controller/mailer.controller');

const router = express.Router();
router.post('/sendEmail', mailerController.sendEmail);

module.exports = router;