const models = require('../models');

function addUser(req, res) {
    const user = {
        companyId: req.body.companyId,
        name: req.body.name,
        email: req.body.description,
        contactNo: req.body.contactNo,
        username: req.body.username,
        role: req.body.role,
        companyName: req.body.companyName,
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
    getUsers: getUsers
}