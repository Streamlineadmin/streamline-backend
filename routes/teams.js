const express = require('express');
const { Model } = require('sequelize');
const teamController = require('../controller/team.controller');

const router = express.Router();
router.post('/addTeam', teamController.addTeam);
router.post('/editTeam', teamController.editTeam);
router.post('/deleteTeam', teamController.deleteTeam);
router.get('/:id', teamController.getTeamsById);
router.post('/', teamController.getTeams);

module.exports = router;