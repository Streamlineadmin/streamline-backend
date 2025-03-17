const convertXlsxToJson = require('../helpers/bulk-upload');
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
                stores: storesWithPositiveQuantity,
                alternateUnits: itemAlternateUnits
            };
        });

        res.status(200).json(itemsWithStores);
    } catch (error) {
        res.status(500).json({
            message: "Something went wrong, please try again later!"
        });
    }
}

async function addBulkItem(req, res) {
    try {
        const file = req.file;
        const data = await convertXlsxToJson(file.filename, 'bulkUpload');
        if (!data.length) {
            return res.status(400).json({ message: 'Add Atleast One Item.' });
        }
        let errorArray = [], err = '';
        for (const item of data) {
            const { '* Item ID': itemId, '* Item Name': itemName, '* Item Type': itemType, '* Metrics Unit': metricsUnit } = item;
            const { companyId } = req.body;
            let category, subCategory, microCategory;
            const existingItem = await models.Items.findOne({
                where: {
                    companyId: companyId,
                    [models.Sequelize.Op.or]: [
                        { itemId: itemId },
                        { itemName: itemName }
                    ]
                }
            });
            if (existingItem) {
                err = 'Item Id Already Exist. '
            }
            if (!itemId || !itemName || !itemType || !metricsUnit) {
                let count = 0, missingKey = '';
                if (!itemId) {
                    count += 1;
                    missingKey = 'itemId';
                }
                if (!itemName) {
                    count += 1;
                    missingKey = 'itemName';
                }
                if (!itemType) {
                    count += 1;
                    missingKey = 'itemType';
                }
                if (!metricsUnit) {
                    count += 1;
                    missingKey = 'metricsUnit';
                }
                if (count === 1) {
                    err += `${missingKey} is required Field. `;
                }
                else err += `Mandatory fields are missing: ${!itemId ? 'itemId' : '' + !itemName ? ' itemName' : '' + !itemType ? ' itemType' : '' + !metricsUnit ? ' metricsUnit' : ''} are required. `;
            }

            if (item?.price || item?.price === 0) {
                err += 'Price Should be Gretaer than 0. '
            }
            if (item?.currentStock && Number(item?.currentStock) < 0) {
                err += 'currentStock Value should be non Negative. '
            }
            if (item?.minStock && Number(item?.minStock) < 0) {
                err += 'minStock Value should be non Negative. '
            }
            if (item?.maxStock && Number(item?.maxStock) < 0) {
                err += 'maxStock Value should be non Negative. '
            }

            const uom = await models.UOM.findOne({
                    where: { name: metricsUnit.split(' ')[0]}
                });
            if(!uom) err+= 'Invalid UOM unit. ';
            if (item?.Category) {
                category = await models.Categories.findOne({
                    where: {
                        name: item?.Category,
                        companyId
                    }
                });
                if (!category) {
                    err += 'Category Not Found. ';
                }
                else {
                    if (item?.['Sub Category']) {
                        subCategory = await models.Categories.findOne({
                            where: {
                                name: item?.['Sub Category'],
                                companyId
                            }
                        });
                        if (!subCategory) {
                            err += 'Sub Category Not Found. ';
                        }
                       
                        else if (subCategory?.parentId != category?.id) {
                            err += 'Sub Category not found under Selected Category. ';
                        }
                        if(item?.['Micro Category'] && subCategory?.parentId == category?.id) {
                            microCategory = await models.Categories.findOne({
                                where: {
                                    name: item?.['Micro Category'],
                                    companyId
                                }
                            });
                            if (!microCategory) err += 'Micro Category Not Found. ';
                            else if (microCategory?.parentId != subCategory?.id)
                                err += 'Micro Category not found under Selected Sub Category. ';
                        }
                    }
                }
            }

            if (err) {
                errorArray.push({ ...item, Error: err });
                continue;
            }
            const itemData = {
                itemId,
                itemName,
                itemType,
                metricsUnit: uom.id,
                category: category?.id || null,
                subCategory: subCategory?.id || null,
                microCategory: microCategory?.id || null,
                HSNCode: item.HSN || null,
                price: item.Price || null,
                taxType: item['Tax Type'] || null,
                tax: item['Tax'] || null,
                minStock: item['Min Stock'] || null,
                maxStock: item['Max Stock'] || null,
                description: item['Description'] || null,
                companyId: Number(companyId),
                status: 1
            };

            await models.Items.create(itemData);
        }
        let msg = '';
        msg = !errorArray.length ? 'Bulk Items Uploaded successfully.' : errorArray.length != data.length ? 'Bulk Items Uploaded Successfully. Few Items Contain Overlapping/Invalid Data. We Download Those Rows for you.' : 'All Items Contain Overlapping/Invalid Data. We Download Those Rows for you.';
        res.status(200).json({ message: msg, invalidData: errorArray });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Something went wrong' });
    }
}

async function bulkEditItems(req, res) {
    const file = req.file;
    const items = await convertXlsxToJson(file.filename, 'bulkEdit');

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Edit Atlease one Item" });
    }

    const transaction = await models.sequelize.transaction();
    const errorArray = [];
    let category, subCategory, microCategory;

    try {
        for (const item of items) {
            const { 'Item ID': itemId, 'Item Name': itemName } = item;
            let err = '';
            if (!itemId) {
                errorArray.push({ ...item, Error: 'Item Id is required.' });
                continue;
            }
            const existingItem = await models.Items.findOne({
                where: {
                    companyId: Number(req?.body?.companyId),
                    [Op.or]: [{ itemId }],
                },
                transaction,
            });

            if (!existingItem) {
                err += 'Item Not Found. ';
            }
            if (item['Price'] && Number(item['Price']) < 0) {
                err += 'Price Should be Gretaer than 0. '
            }
            if (item['Min Stock'] && Number(item['Min Stock']) < 0) {
                err += 'Max Stock Value should be non Negative. '
            }
            if (item['Max Stock'] && Number(item['Max Stock']) < 0) {
                err += 'Max Stock Value should be non Negative. '
            }

            if (item?.Category) {
                category = await models.Categories.findOne({
                    where: {
                        name: item?.Category,
                        companyId: req?.body?.companyId
                    }
                });
                if (!category) {
                    err += 'Category Not Found. ';
                }
                else {
                    if (item?.['Sub Category']) {
                        subCategory = await models.Categories.findOne({
                            where: {
                                name: item?.['Sub Category'],
                                companyId: req?.body?.companyId,
                            }
                        });
                        if (!subCategory) {
                            err += 'Sub Category Not Found. ';
                        }
                        else if (subCategory?.parentId != category?.id) {
                            err += 'Sub Category not found under Selected Category. ';
                        }
                        if (item?.['Micro Category'] && subCategory?.parentId == category?.id) {
                            microCategory = await models.Categories.findOne({
                                where: {
                                    name: item?.['Micro Category'],
                                    companyId: req?.body?.companyId,
                                }
                            });
                            if (!microCategory) err += 'Micro Category Not Found. ';
                            else if (microCategory?.parentId != subCategory?.id)
                                err += 'Micro Category not found under Selected Sub Category. ';
                        }
                    }
                }
            }
           

            if (err) {
                errorArray.push({ ...item, Error: err });
                continue;
            }

            const updatedObj = {
                itemId,
                itemName
            };
            if (item['HSN']) updatedObj.HSNCode = item['HSN'];
            if (item['Category']) updatedObj.category = category?.id;
            if (item['Sub Category']) updatedObj.subCategory = subCategory?.id;
            if (item['Micro Category']) updatedObj.microCategory = microCategory?.id;
            if (item['Price']) updatedObj.price = item['Price'];
            if (item['Min Stock']) updatedObj.minStock = item['Min Stock'];
            if (item['Max Stock']) updatedObj.maxStock = item['Max Stock'];
            if (item.Description) updatedObj.description = item.description;
            if (item['Tax Type']) updatedObj.taxType = item['Tax Type'] == 'Inclusive' ? 1 : 2;
            if (item['Tax']) updatedObj.tax = item['Tax'];
            if (item['Item type']) updatedObj.itemType = item['Item type'] == 'Buy' ? 1 : item['Item type'] == 'Sell' ? 2 : 3;
            if (item.Description) updatedObj.description = item.Description;

            await models.Items.update(
                updatedObj,
                { where: { itemId, companyId: Number(req.body.companyId) }, transaction }
            );
        }

        await transaction.commit();
        msg = !errorArray.length ? 'Bulk Items Edited successfully.' : errorArray.length != items.length ? 'Few data are Invalid. We Download Those Rows for you.' : 'All Items are Invalid. We Download Invalid Rows for you.'
        return res.status(200).json({ message: msg, invalidData: errorArray });

    } catch (error) {
        console.log(error);
        transaction.rollback();
        return res.status(500).json({ message: "Something went wrong, please try again later!", error });
    }
}

async function stockReconcilation(req, res) {
    const file = req.file;
    const items = await convertXlsxToJson(file.filename, 'reconcileStock');

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Empty data found." });
    }

    const errorArray = [];

    try {
        for (const item of items) {
            const { 'Item ID': itemId, 'Price/Unit': price } = item;
            let err = '';
            const existingItem = await models.Items.findOne({
                where: {
                    itemId: Number(itemId),
                    companyId: Number(req.body.companyId)
                }
            });
            if (!existingItem) {
                err += 'Item Not Found. ';
            }
            if (item['Final Stock'] != 0 && !item['Final Stock']) {
                err += 'Final Stock is required Field. '
            }
            if (item['Final Stock'] && Number(item['Final Stock']) < 0) {
                err += 'Final Stock Value Should not be negative.'
            }
            if (err) {
                errorArray.push({ ...item, Error: err });
                continue;
            }
            const storeItem = await models.StoreItems.findOne({
                where: {
                    storeId: Number(req.body.storeId),
                    itemId: existingItem.id,
                    addedBy: Number(req.body.companyId)
                }
            });
            if (!storeItem) {
                const storeItemData = {
                    storeId: Number(req.body.storeId),
                    itemId: existingItem.id,
                    quantity: Number(item['Final Stock']),
                    addedBy: Number(req.body.companyId),
                    status: 1
                };

                await models.StoreItems.create(storeItemData)
            }
            else {
                const updated = await storeItem.update({ quantity: Number(item['Final Stock']) });
            }

        }
        msg = !errorArray.length ? 'Stocks Reconcile Successfully.' : errorArray.length != items.length ? 'Few Items are Not Found. We Download Those Rows for you.' : 'All Items are Not Found. We Download Those Rows for you.'
        return res.status(200).json({ message: msg, invalidData: errorArray });

    } catch (error) {
        return res.status(500).json({ message: "Something went wrong, please try again later!", error, items });
    }
}


module.exports = {
    addItem: addItem,
    getItems: getItems,
    editItem: editItem,
    deleteItem: deleteItem,
    deleteItems: deleteItems,
    addBulkItem: addBulkItem,
    bulkEditItems: bulkEditItems,
    stockReconcilation: stockReconcilation
}