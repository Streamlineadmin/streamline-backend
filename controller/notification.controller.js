const models = require('../models');

function notify(req, res) {
    const notification = {
        notification: req.body.notification,
        companyId: req.body.companyId,
        createdBy: req.body.createdBy,
        createdByName: req.body.createdByName,
        status: 1, // Default status
        ip_address: req.body.ip_address
    };

    models.Notifications.create(notification)
        .then(result => {
            res.status(201).json({
                message: "Notification added successfully",
                notification: result
            });
        })
        .catch(error => {
            res.status(500).json({
                message: "Something went wrong, please try again later!",
                error: error
            });
        });
}

function dismissNotification(req, res) {
    const notificationId = req.body.notificationId; // Assuming notification ID is passed in the body

    models.Notifications.update(
        { status: 0 },  // Change status to 0 (dismiss the notification)
        { where: { id: notificationId } }
    ).then(result => {
        if (result[0] === 1) { // Sequelize returns an array, result[0] shows how many rows were updated
            res.status(200).json({
                message: "Notification dismissed successfully"
            });
        } else {
            res.status(200).json({
                message: "Notification not found"
            });
        }
    }).catch(error => {
        res.status(500).json({
            message: "Something went wrong, please try again later!",
            error: error
        });
    });
}

function getNotifications(req, res) {
    models.Notifications.findAll({
        where: {
            companyId: req.body.companyId
        }
    }).then(result => {
        if (!result || result.length === 0) {
            return res.status(200).json([]);
        }
        res.status(200).json(result);
    }).catch(error => {
        res.status(500).json({
            message: "Something went wrong, please try again later!",
            error: error
        });
    });
}

module.exports = {
    notify: notify,
    dismissNotification: dismissNotification,
    getNotifications: getNotifications
};
