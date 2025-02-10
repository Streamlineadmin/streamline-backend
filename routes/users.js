const express = require('express');
const { Model } = require('sequelize');
const userController = require('../controller/user.controller');

const router = express.Router();
router.post('/addUser', userController.addUser);
router.post('/editUser', userController.editUser);
router.post('/deleteUser', userController.deleteUser);
router.post('/updateProfile', userController.updateProfile)
router.post('/', userController.getUsers);

module.exports = router;