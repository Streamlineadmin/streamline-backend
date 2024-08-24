const models = require('../models');

function addTeam(req, res) {
    const team = {
        companyId: req.body.companyId,
        name: req.body.name,
        description: req.body.description,
        ip_address: req.body.ip_address,
        status: 1
    }

    models.Teams.create(team).then(result => {
        res.status(201).json({
            message: "Team added successfully",
            post: result
        });
    }).catch(error => {
        res.status(500).json({
            message: "Something went wrong, please try again later!",
            error: error
        });
    });
}

function editTeam(req, res) {
    const teamId = req.body.teamId;

    const updatedTeamData = {
        companyId: req.body.companyId,
        name: req.body.name,
        description: req.body.description,
        ip_address: req.body.ip_address,
        status: req.body.status || 1  // Optional, defaults to 1 if not provided
    };

    models.Teams.update(updatedTeamData, { where: { id: teamId } })
        .then(result => {
            if (result[0] > 0) {
                res.status(200).json({
                    message: "Team updated successfully",
                    post: updatedTeamData
                });
            } else {
                res.status(200).json({
                    message: "Team not found"
                });
            }
        })
        .catch(error => {
            res.status(500).json({
                message: "Something went wrong, please try again later!",
                error: error
            });
        });
}

function deleteTeam(req, res) {
    const teamId = req.body.teamId;  // Assuming the team ID is passed as a URL parameter

    models.Teams.destroy({ where: { id: teamId } })
        .then(result => {
            if (result) {
                res.status(200).json({
                    message: "Team deleted successfully"
                });
            } else {
                res.status(200).json({
                    message: "Team not found"
                });
            }
        })
        .catch(error => {
            res.status(500).json({
                message: "Something went wrong, please try again later!",
                error: error
            });
        });
}

function getTeamsById(req, res) {
    const id = req.params.id;

    models.Teams.findByPk(id).then(result => {
        res.status(200).json(result);
    }).catch(error => {
        res.status(500).json({
            message: "something went wrong, please try again later!"
        });
    });
}

function getTeams(req, res) {
    models.Teams.findAll({
        where: {
            companyId: req.body.companyId
        }
    }).then(result => {
        if (!result || result.length === 0) {
            return res.status(200).json([]);
        }
        res.status(200).json(result);
    })
        .catch(error => {
            console.error("Error fetching blogs:", error);
            res.status(500).json({
                message: "Something went wrong, please try again later!"
            });
        });
}


module.exports = {
    addTeam: addTeam,
    getTeamsById: getTeamsById,
    getTeams: getTeams,
    editTeam: editTeam,
    deleteTeam: deleteTeam
}