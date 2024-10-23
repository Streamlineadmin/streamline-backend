const models = require('../models');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');

function signUp(req, res) {
    // Check if email already exists
    models.Users.findOne({ where: { email: req.body.email } })
        .then(emailResult => {
            if (emailResult) {
                return res.status(409).json({
                    message: "Email already exists!"
                });
            }
            // Check if username already exists
            return models.Users.findOne({ where: { username: req.body.username } });
        })
        .then(usernameResult => {
            if (usernameResult) {
                return res.status(409).json({
                    message: "Username already exists!"
                });
            }
            // Check if companyName already exists
            return models.Users.findOne({ where: { companyName: req.body.companyName } });
        })
        .then(companyNameResult => {
            if (companyNameResult) {
                return res.status(409).json({
                    message: "Company Name already exists!"
                });
            }
            // If no conflicts, proceed with signup
            bcryptjs.genSalt(10, function (err, salt) {
                bcryptjs.hash(req.body.password, salt, function (err, hashed) {
                    const client = {
                        companyName: req.body.companyName,
                        email: req.body.email,
                        username: req.body.username,
                        password: hashed,
                        contactNo: req.body.contactNo,
                        website: req.body.website,
                        address: req.body.address
                    };

                    models.Users.create(client)
                        .then(result => {
                            res.status(201).json({
                                message: "Signed up successfully",
                            });
                        })
                        .catch(error => {
                            res.status(500).json({
                                message: "Something went wrong! Please try again later.",
                            });
                        });
                });
            });
        })
        .catch(error => {
            res.status(500).json({
                message: "Something went wrong! Please try again later.",
            });
        });
}


function login(req, res) {
    models.Users.findOne({ where: { email: req.body.email } }).then(user => {
        if (user === null) {
            res.status(401).json({
                message: "Invalid Credentials!",
            });
        } else {
            bcryptjs.compare(req.body.password, user.password, function (err, result) {
                if (result) {
                    const token = jwt.sign({
                        username: user.username,
                        email: user.email,
                        userId: user.id,
                        companyId: user.companyId,
                        companyName: user.companyName
                    }, 'secret', function (err, token) {
                        res.status(200).json({
                            message: "Authentication successful.",
                            token: token
                        });
                    });
                } else {
                    res.status(401).json({
                        message: "Invalid credentials !"
                    })
                }
            })
        }
    }).catch(error => {
        res.status(500).json({
            message: "Something went wrong, Please try again later!",
        })
    })
}

module.exports = {
    signUp: signUp,
    login: login
}