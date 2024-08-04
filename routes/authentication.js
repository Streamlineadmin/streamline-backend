const express = require('express');
const authenticationController = require('../controller/authentication.controller');

const router = express.Router();

router.post('/signup', authenticationController.signUp);
router.post('/login', authenticationController.login);

module.exports = router;