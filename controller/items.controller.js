const models = require('../models');
const { Op } = require("sequelize");

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

async function editItem(req, res) {
    const { id, itemId, itemName, companyId, alternateUnits } = req.body;

    try {
        // Check if itemId or itemName already exists for another item in the same company
        const existingItem = await models.Items.findOne({
            where: {
                companyId: companyId,
                [Op.or]: [{ itemId }, { itemName }],
                id: { [Op.ne]: id }, // Exclude the current item
            },
        });

        if (existingItem) {
            let message = existingItem.itemId === itemId && existingItem.itemName === itemName
                ? "Both Item ID and Item name already exist for another item!"
                : existingItem.itemId === itemId
                ? "Item ID already exists for another item!"
                : "Item name already exists for another item!";

            return res.status(409).json({ message });
        }

        // Transaction ensures atomic update
        const transaction = await models.sequelize.transaction();

        try {
            // Update item details
            await models.Items.update(
                {
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
                },
                { where: { id }, transaction }
            );

            // Remove existing alternate units for this item
            await models.AlternateUnits.destroy({
                where: { itemId: id },
                transaction,
            });

            // Insert new alternate units
            if (alternateUnits && alternateUnits.length > 0) {
                const newAlternateUnits = alternateUnits.map((unit) => ({
                    itemId: id,
                    alternateUnits: unit.alternateUnits,
                    conversionfactor: unit.conversionfactor,
                    ip_address: req.body.ip_address, 
                    status: 1, 
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }));

                await models.AlternateUnits.bulkCreate(newAlternateUnits, { transaction });
            }

            await transaction.commit();

            return res.status(200).json({
                message: "Item updated successfully",
                post: { itemId, itemName, alternateUnits },
            });

        } catch (error) {
            await transaction.rollback();
            console.error("Transaction failed:", error);
            return res.status(500).json({ message: "Something went wrong, please try again later!", error });
        }

    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ message: "Something went wrong, please try again later!", error });
    }
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
            where: { companyId },
            raw: true  
        });

        if (!items || items.length === 0) {
            return res.status(200).json([]);
        }

        // Step 2: Retrieve store IDs and quantities associated with each item
        const itemIds = items.map(item => item.id);
        
        const storeItems = await models.StoreItems.findAll({
            where: { itemId: itemIds },
            attributes: ['itemId', 'storeId', 'quantity'],
            raw: true
        });

        // Step 3: Retrieve all alternate units for the given item IDs
        const alternateUnits = await models.AlternateUnits.findAll({
            where: { itemId: itemIds },
            attributes: ['itemId', 'alternateUnits', 'conversionfactor', 'ip_address'],
            raw: true
        });

        // Step 4: Structure the response with unique stores, net quantities, and alternate units
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

            // Get alternate units for the current item
            const itemAlternateUnits = alternateUnits
                .filter(unit => unit.itemId === item.id)
                .map(({ alternateUnits, conversionfactor, ip_address }) => ({
                    alternateUnits,
                    conversionfactor,
                    ip_address
                }));

            return {
                ...item,
                stores: storesWithPositiveQuantity, // Include unique stores and their positive quantities
                alternateUnits: itemAlternateUnits  // Include alternate units and conversion factors
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