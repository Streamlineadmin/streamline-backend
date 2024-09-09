const models = require('../models');

function addItem(req, res) {
    const itemData = {
        itemId: req.body.itemId,
        itemName: req.body.itemName,
        itemType: req.body.itemType,
        category: req.body.category,
        metricsUnit: req.body.metricsUnit,
        HSNCode: req.body.HSNCode,
        price: req.body.price,
        taxType: req.body.taxType,
        currentStock: req.body.currentStock,
        minStock: req.body.minStock,
        maxStock: req.body.maxStock,
        description: req.body.description,
        companyId: req.body.companyId,
        status: 1
    }

    models.Items.create(itemData).then(result => {
        res.status(200).json({
            message: "Item added successfully",
            post: result
        });
    }).catch(error => {
        res.status(500).json({
            message: "Something went wrong, please try again later!",
            error: error
        });
    });
}

function editItem(req, res) {
    const itemId = req.body.itemId;

    const updatedItemData = {
        itemId: req.body.itemId,
        itemName: req.body.itemName,
        itemType: req.body.itemType,
        category: req.body.category,
        metricsUnit: req.body.metricsUnit,
        HSNCode: req.body.HSNCode,
        price: req.body.price,
        taxType: req.body.taxType,
        currentStock: req.body.currentStock,
        minStock: req.body.minStock,
        maxStock: req.body.maxStock,
        description: req.body.description,
    };

    models.Items.update(updatedItemData, { where: { id: itemId } })
        .then(result => {
            if (result[0] > 0) {
                res.status(200).json({
                    message: "Item updated successfully",
                    post: updatedTeamData
                });
            } else {
                res.status(200).json({
                    message: "Item not found"
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

function deleteItem(req, res) {
    const itemId = req.body.itemId;  // Assuming the team ID is passed as a URL parameter

    models.Items.destroy({ where: { id: itemId } })
        .then(result => {
            if (result) {
                res.status(200).json({
                    message: "Item deleted successfully"
                });
            } else {
                res.status(200).json({
                    message: "Item not found"
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

function getItems(req, res) {
    models.Items.findAll({
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
    addItem: addItem,
    getItems: getItems,
    editItem: editItem,
    deleteItem: deleteItem
}