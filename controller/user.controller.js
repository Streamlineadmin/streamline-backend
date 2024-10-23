const models = require('../models');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

function addUser(req, res) {
    const { email, username, contactNo } = req.body;

    // Execute all checks in parallel
    Promise.all([
        models.Users.findOne({ where: { email } }),
        models.Users.findOne({ where: { username } }),
        models.Users.findOne({ where: { contactNo } })
    ])
        .then(([emailResult, usernameResult, contactNoResult]) => {
            if (emailResult) {
                return res.status(409).json({
                    message: "Email already exists!",
                });
            }
            if (usernameResult) {
                return res.status(409).json({
                    message: "Username already exists!",
                });
            }
            if (contactNoResult) {
                return res.status(409).json({
                    message: "This contact number belongs to someone else!",
                });
            }

            // If all checks pass, create the user
            const client = {
                name: req.body.name,
                email: req.body.email,
                contactNo: req.body.contactNo,
                username: req.body.username,
                role: req.body.role,
                companyName: req.body.companyName,
                companyId: req.body.companyId,
                ip_address: req.body.ip_address,
                status: 1
            };

            return models.Users.create(client);
        })
        .then(result => {
            res.status(201).json({
                message: "User created successfully",
            });
        })
        .catch(error => {
            res.status(500).json({
                message: "Something went wrong! Please try again later.",
                error: error.message || error,  // Optional: Log the actual error message
            });
        });
}

function editUser(req, res) {
    const userId = req.body.userId;
    const { companyName,
        contactNo,
        email,
        username,
        name,
        role,
        website } = req.body;
        
    const updatedUserData = {
        companyName,
        contactNo,
        email,
        username,
        name,
        role,
        website
    };

    // Check if email, username, or contactNo exists for another user (exclude current user)
    models.Users.findOne({
        where: {
            [models.Sequelize.Op.or]: [
                { email: email, id: { [models.Sequelize.Op.ne]: userId } },
                { username: username, id: { [models.Sequelize.Op.ne]: userId } },
                { contactNo: contactNo, id: { [models.Sequelize.Op.ne]: userId } }
            ]
        }
    })
        .then(existingUser => {
            if (existingUser) {
                if (existingUser.email === email) {
                    return res.status(409).json({
                        message: "Email already exists!",
                    });
                } else if (existingUser.username === username) {
                    return res.status(409).json({
                        message: "Username already exists!",
                    });
                } else if (existingUser.contactNo === contactNo) {
                    return res.status(409).json({
                        message: "Contact number already exists!",
                    });
                }
            } else {
                // No conflict, proceed with the update
                models.Users.update(updatedUserData, { where: { id: userId } })
                    .then(result => {
                        if (result[0] > 0) {
                            res.status(200).json({
                                message: "User updated successfully",
                                post: updatedUserData
                            });
                        } else {
                            res.status(404).json({
                                message: "User not found"
                            });
                        }
                    })
                    .catch(error => {
                        res.status(500).json({
                            message: "Something went wrong, please try again later!",
                            error: error.message || error
                        });
                    });
            }
        })
        .catch(error => {
            res.status(500).json({
                message: "Something went wrong, please try again later!",
                error: error.message || error
            });
        });
}


function deleteUser(req, res) {
    const userId = req.body.userId;  // Assuming the blog ID is passed as a URL parameter

    models.Users.destroy({ where: { id: userId } })
        .then(result => {
            if (result) {
                res.status(200).json({
                    message: "User deleted successfully"
                });
            } else {
                res.status(200).json({
                    message: "Blog not found"
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

function getUsers(req, res) {
    models.Users.findAll({
        where: {
            companyId: req.body.companyId,
            role: {
                [Op.notIn]: [1, 2]  // Exclude roles 1 and 2
            }
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
    addUser: addUser,
    getUsers: getUsers,
    editUser: editUser,
    deleteUser: deleteUser
}