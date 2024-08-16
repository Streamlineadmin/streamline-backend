const models = require('../models');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');

function signUp(req, res) {
    models.Users.findOne({where: {email: req.body.email}}).then(result => {
        if(result) {
            res.status(409).json({
                message: "Email already exists !",
            });
        } else {
            bcryptjs.genSalt(10, function(err, salt) {
                bcryptjs.hash(req.body.password, salt, function(err, hashed) {
                    console.log(hashed);
                    const client = {
                        name: req.body.name,
                        username: req.body.username,
                        email: req.body.email,
                        password: hashed
                    }
                
                    models.Users.create(client).then(result => {
                        res.status(201).json({
                            message: "Signed up successfully",
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
    
}

function login(req, res) {
    models.Users.findOne({where:{email: req.body.email}}).then(user => {
        if(user === null) {
            res.status(401).json({
                message: "Invalid Credentials!",
            });
        } else {
            bcryptjs.compare(req.body.password, user.password, function(err, result) {
                if(result) {
                    const token = jwt.sign({
                        email: user.email,
                        userId: user.id,
                        companyId: user.companyId
                    }, 'secret', function(err, token) {
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