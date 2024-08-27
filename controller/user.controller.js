const models = require('../models');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');

function addUser(req, res) {
    models.Users.findOne({ where: { email: req.body.email } }).then(result => {
        if (result) {
            res.status(409).json({
                message: "Email already exists !",
            });
        } else {
            bcryptjs.genSalt(10, function (err, salt) {
                bcryptjs.hash(req.body.password, salt, function (err, hashed) {
                    console.log(hashed);
                    const client = {
                        name: req.body.name,
                        email: req.body.email,
                        contactNo: req.body.contactNo,
                        username: req.body.username,
                        password: hashed,
                        role: req.body.role,
                        companyName: req.body.companyName,
                        companyId: req.body.companyId,
                        ip_address: req.body.ip_address,
                        status: 1
                    }

                    models.Users.create(client).then(result => {
                        res.status(201).json({
                            message: "User created successfully",
                        });
                    }).catch(error => {
                        res.status(500).json({
                            message: "Something went wrong!, Please try again later",
                        });
                    });
                })
            })
        }
    }).catch(error => {
        res.status(500).json({
            message: "Something went wrong!, Please try again later",
        });
    });


    const user = {
        companyId: req.body.companyId,
        name: req.body.name,
        email: req.body.email,
        contactNo: req.body.contactNo,
        username: req.body.username,
        role: req.body.role,
        companyName: req.body.companyName,
        companyId: req.body.companyId,
        ip_address: req.body.ip_address,
        status: 1
    }

    models.Users.create(user).then(result => {
        res.status(201).json({
            message: "User added successfully",
            post: result
        });
    }).catch(error => {
        res.status(500).json({
            message: "Something went wrong, please try again later!",
            error: error
        });
    });
}

function editUser(req, res) {
    const userId = req.body.userId;

    const updatedUserData = {
        name: req.body.name,
        email: req.body.email,
        contactNo: req.body.contactNo,
        role: req.body.role,
    };

    models.Users.update(updatedUserData, { where: { id: userId } })
        .then(result => {
            if (result[0] > 0) {
                res.status(200).json({
                    message: "User updated successfully",
                    post: updatedBlogData
                });
            } else {
                res.status(404).json({
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
    addUser: addUser,
    getUsers: getUsers,
    editUser: editUser,
    deleteUser: deleteUser
}