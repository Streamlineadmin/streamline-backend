const express = require('express');
const { Model } = require('sequelize');
const notificationController = require('../controller/notification.controller');

const router = express.Router();
router.post('/notify', notificationController.notify);
router.post('/', notificationController.getNotifications);
router.post('/dismissNotification', notificationController.dismissNotification);

module.exports = router;