const express = require('express');
const authenticationController = require('../controller/authentication.controller');
const checkAuthMiddleware = require('../middleware/check-auth')
const router = express.Router();

router.post('/signup', authenticationController.signUp);
router.post('/login', authenticationController.login);
router.post('/forgotpassword', authenticationController.forgotPassword);

module.exports = router;