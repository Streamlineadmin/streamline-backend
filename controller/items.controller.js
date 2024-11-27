const models = require('../models');

function addItem(req, res) {
    const { itemId, itemName, itemType, metricsUnit, companyId } = req.body;

    // Check for mandatory fields
    if (!itemId || !itemName || !itemType || !metricsUnit) {
        return res.status(400).json({
            message: "Mandatory fields are missing: itemId, itemName, itemType, and metricsUnit are required."
        });
    }

    // Check if itemId or itemName already exists for the same company
    models.Items.findOne({
        where: {
            companyId: companyId,
            [models.Sequelize.Op.or]: [
                { itemId: itemId },
                { itemName: itemName }
            ]
        }
    })
        .then(itemResult => {
            if (itemResult) {
                let message = "";
                if (itemResult.itemId === itemId && itemResult.itemName === itemName) {
                    message = "Both Item ID and Item name already exist!";
                } else if (itemResult.itemId === itemId) {
                    message = "Item ID already exists!";
                } else {
                    message = "Item name already exists!";
                }
                return res.status(409).json({ message });
            } else {
                // Proceed to add the item if no conflicts
                const itemData = {
                    itemId,
                    itemName,
                    itemType,
                    metricsUnit,
                    category: req.body.category,
                    subCategory: req.body.subCategory,
                    microCategory: req.body.microCategory,
                    HSNCode: req.body.HSNCode,
                    price: req.body.price,
                    taxType: req.body.taxType,
                    tax: req.body.tax || null,
                    currentStock: req.body.currentStock,
                    minStock: req.body.minStock,
                    maxStock: req.body.maxStock,
                    description: req.body.description,
                    companyId,
                    status: 1
                };

                models.Items.create(itemData)
                    .then(result => {
                        const newItemId = result.id; // Use the primary key generated for the new item

                        // Add entry to StoresItem table
                        const storeItemData = {
                            storeId: req.body.storeId,     // storeId from req.body.store
                            itemId: newItemId,  // Use the generated item ID
                            quantity: req.body.currentStock || 0, // Default quantity; adjust if needed
                            addedBy: req.body.userId,
                            status: 1
                        };

                        models.StoreItems.create(storeItemData)
                            .then(() => {
                                res.status(201).json({
                                    message: "Item added successfully and associated with the store",
                                    item: result
                                });
                            })
                            .catch(storeError => {
                                res.status(500).json({
                                    message: "Item created, but failed to add to StoresItem.",
                                    error: storeError
                                });
                            });
                    })
                    .catch(error => {
                        res.status(500).json({
                            message: "Something went wrong, please try again later!",
                            error: error
                        });
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



function editItem(req, res) {
    const id = req.body.id;
    const { itemId, itemName, companyId } = req.body;

    // Check if itemId or itemName already exists for another item in the same company
    models.Items.findOne({
        where: {
            companyId: companyId,
            [models.Sequelize.Op.or]: [
                { itemId: itemId },
                { itemName: itemName }
            ],
            id: { [models.Sequelize.Op.ne]: id } // Exclude current item being edited
        }
    })
        .then(itemResult => {
            if (itemResult) {
                let message = "";
                if (itemResult.itemId === itemId && itemResult.itemName === itemName) {
                    message = "Both Item ID and Item name already exist for another item!";
                } else if (itemResult.itemId === itemId) {
                    message = "Item ID already exists for another item!";
                } else {
                    message = "Item name already exists for another item!";
                }
                return res.status(409).json({ message });
            } else {
                // Proceed with updating the item if no conflicts
                const updatedItemData = {
                    itemId,
                    itemName,
                    itemType: req.body.itemType,
                    category: req.body.category,
                    metricsUnit: req.body.metricsUnit,
                    HSNCode: req.body.HSNCode,
                    price: req.body.price,
                    taxType: req.body.taxType,
                    tax: req.body.tax,
                    currentStock: req.body.currentStock,
                    minStock: req.body.minStock,
                    maxStock: req.body.maxStock,
                    description: req.body.description,
                };

                models.Items.update(updatedItemData, { where: { id: id } })
                    .then(result => {
                        if (result[0] > 0) {
                            res.status(200).json({
                                message: "Item updated successfully",
                                post: updatedItemData
                            });
                        } else {
                            res.status(404).json({
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

function deleteItems(req, res) {
    const { items } = req.body; // Extract item IDs from the payload

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
            message: "Invalid or empty 'items' array in the request payload.",
        });
    }

    models.Items.destroy({
        where: { id: items },
    })
        .then(deletedCount => {
            if (deletedCount > 0) {
                res.status(200).json({
                    message: `${deletedCount} item(s) deleted successfully.`,
                });
            } else {
                res.status(404).json({
                    message: "No items found with the provided IDs.",
                });
            }
        })
        .catch(error => {
            console.error("Error deleting items:", error);
            res.status(500).json({
                message: "Something went wrong, please try again later!",
                error: error.message,
            });
        });
}


async function getItems(req, res) {
    const { companyId } = req.body;

    try {
        // Step 1: Retrieve all items for the given company
        const items = await models.Items.findAll({
            where: { companyId }
        });

        if (!items || items.length === 0) {
            return res.status(200).json([]);
        }

        // Step 2: Retrieve store IDs and quantities associated with each item
        const itemIds = items.map(item => item.id);
        const storeItems = await models.StoreItems.findAll({
            where: {
                itemId: itemIds
            },
            attributes: ['itemId', 'storeId', 'quantity']
        });

        // Step 3: Structure the response to include unique stores and net quantities for each item
        const itemsWithStores = items.map(item => {
            // Aggregate quantities for each storeId related to the current item
            const storeQuantities = storeItems
                .filter(storeItem => storeItem.itemId === item.id)
                .reduce((acc, { storeId, quantity }) => {
                    acc[storeId] = (acc[storeId] || 0) + quantity; // Sum quantities for each store
                    return acc;
                }, {});

            // Filter out stores with a non-positive (0 or negative) net quantity
            const storesWithPositiveQuantity = Object.entries(storeQuantities)
                .filter(([_, quantity]) => quantity > 0)
                .map(([storeId, quantity]) => ({
                    storeId: parseInt(storeId),
                    quantity
                }));

            return {
                ...item.toJSON(),
                stores: storesWithPositiveQuantity // Include unique stores and their positive quantities
            };
        });

        // Send the structured response
        res.status(200).json(itemsWithStores);
    } catch (error) {
        console.error("Error fetching items:", error);
        res.status(500).json({
            message: "Something went wrong, please try again later!"
        });
    }
}

module.exports = {
    addItem: addItem,
    getItems: getItems,
    editItem: editItem,
    deleteItem: deleteItem,
    deleteItems: deleteItems
}