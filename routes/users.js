const express = require('express');
const { Model } = require('sequelize');
const userController = require('../controller/user.controller');

const router = express.Router();
router.post('/addUser', userController.addUser);
router.post('/', userController.getUsers);

module.exports = router;