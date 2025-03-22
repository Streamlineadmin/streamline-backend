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
            return res.status(400).json({ message: 'Add At Least One Item.' });
        }

        const { companyId } = req.body;
        let errorArray = [];
        let err = '';

        const itemIds = data.map(item => item['* Item ID']);
        const itemNames = data.map(item => item['* Item Name']);

        const existingItems = await models.Items.findAll({
            where: {
                companyId,
                [Op.or]: [
                    { itemId: { [Op.in]: itemIds } },
                    { itemName: { [Op.in]: itemNames } }
                ]
            }
        });

        const existingItemMap = new Map(existingItems.map(item => [item.itemId, true]));

        const categoryNames = [...new Set(data.map(item => item.Category).filter(Boolean))];
        const subCategoryNames = [...new Set(data.map(item => item['Sub Category']).filter(Boolean))];
        const microCategoryNames = [...new Set(data.map(item => item['Micro Category']).filter(Boolean))];

        const categories = await models.Categories.findAll({
            where: { name: { [Op.in]: categoryNames }, companyId }
        });

        const subCategories = await models.Categories.findAll({
            where: { name: { [Op.in]: subCategoryNames }, companyId }
        });

        const microCategories = await models.Categories.findAll({
            where: { name: { [Op.in]: microCategoryNames }, companyId }
        });

        const categoryMap = new Map(categories.map(cat => [cat.name, cat]));
        const subCategoryMap = new Map(subCategories.map(sub => [sub.name, sub]));
        const microCategoryMap = new Map(microCategories.map(micro => [micro.name, micro]));

        const itemsData = [];

        for (const item of data) {
            const { '* Item ID': itemId, '* Item Name': itemName, '* Item Type': itemType } = item;
            if (existingItemMap.has(itemId?.toString())) {
                err = 'Item ID already exists. ';
            }
            if (!itemId || !itemName || !itemType) {
                err += 'Required fields are missing. ';
            }

            if (item?.Price <= 0) {
                err += 'Price should be greater than 0. ';
            }
            if (item?.['Min Stock'] && item?.['Min Stock'] < 0) {
                err += 'Min Stock must be non-negative. ';
            }
            if (item?.['Max Stock'] && item?.['Max Stock'] < 0) {
                err += 'Max Stock must be non-negative. ';
            }

            let category = categoryMap.get(item.Category) || null;
            let subCategory = subCategoryMap.get(item['Sub Category']) || null;
            let microCategory = microCategoryMap.get(item['Micro Category']) || null;

            if (item.Category && !category) {
                err += "Category Not Found. ";
            }
            if (item["Sub Category"] && !subCategory) {
                err += "Sub Category Not Found. ";
            }
            if (item["Sub Category"] && category.id != subCategory.parentId) {
                err += "Sub Category Not Found under this Category. "
            }
            if (item["Micro Category"] && !microCategory) {
                err += "Micro Category Not Found. ";
            }
            if (item["Micro Category"] && subCategory.id != microCategory.parentId) {
                err += "Micro Category Not Found under this Sub Category. "
            }

            if (err) {
                errorArray.push({ ...item, Error: err });
                err = '';
                continue;
            }

            itemsData.push({
                itemId,
                itemName,
                itemType,
                metricsUnit: 'uom.id',
                category: category?.id || null,
                subCategory: subCategory?.id || null,
                microCategory: microCategory?.id || null,
                HSNCode: item.HSN || null,
                price: item.Price || null,
                taxType: item['Tax Type'] ? item['Tax Type'] == 'Inclusive' ? 1 : 2 : null,
                tax: item['Tax'] || null,
                minStock: item['Min Stock'] || null,
                maxStock: item['Max Stock'] || null,
                description: item['Description'] || null,
                companyId: Number(companyId),
                status: 1
            });
        }

        if (itemsData.length) {
            await models.Items.bulkCreate(itemsData);
        }

        const msg = !errorArray.length
            ? 'Bulk items uploaded successfully.'
            : errorArray.length !== data.length
                ? 'Bulk items uploaded successfully. Some rows contain invalid data. We Download Those Rows for you.'
                : 'All rows contain invalid data. We Download Those Rows for you.';

        res.status(200).json({ message: msg, invalidData: errorArray });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Something went wrong' });
    }
}

async function bulkEditItems(req, res) {
    try {
        const file = req.file;
        const items = await convertXlsxToJson(file.filename, "bulkEdit");

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: "Edit at least one item" });
        }

        const companyId = Number(req.body.companyId);
        const itemIds = items.map(item => item["Item ID"]).filter(Boolean);

        const existingItems = await models.Items.findAll({
            where: { companyId, itemId: { [Op.in]: itemIds } },
        });

        const existingItemsMap = new Map(existingItems.map(item => [item.itemId, item]));

        const categoryNames = [...new Set(items.map(item => item.Category).filter(Boolean))];
        const subCategoryNames = [...new Set(items.map(item => item["Sub Category"]).filter(Boolean))];
        const microCategoryNames = [...new Set(items.map(item => item["Micro Category"]).filter(Boolean))];

        const categories = await models.Categories.findAll({ where: { name: { [Op.in]: categoryNames }, companyId } });
        const subCategories = await models.Categories.findAll({ where: { name: { [Op.in]: subCategoryNames }, companyId } });
        const microCategories = await models.Categories.findAll({ where: { name: { [Op.in]: microCategoryNames }, companyId } });
        const categoryMap = new Map(categories.map(cat => [cat.name, cat]));
        const subCategoryMap = new Map(subCategories.map(sub => [sub.name, sub]));
        const microCategoryMap = new Map(microCategories.map(micro => [micro.name, micro]));

        let errorArray = [];
        let updateData = [];

        for (const item of items) {
            const { "Item ID": itemId, "Item Name": itemName } = item;
            let err = "";

            if (!itemId) {
                errorArray.push({ ...item, Error: "Item ID is required." });
                continue;
            }

            const existingItem = existingItemsMap.get(itemId);
            if (!existingItem) {
                err += "Item Not Found. ";
            }

            if (item["Price"] && Number(item["Price"]) < 0) {
                err += "Price should be greater than 0. ";
            }
            if (item["Min Stock"] && Number(item["Min Stock"]) < 0) {
                err += "Min Stock value should be non-negative. ";
            }
            if (item["Max Stock"] && Number(item["Max Stock"]) < 0) {
                err += "Max Stock value should be non-negative. ";
            }

            let category = categoryMap.get(item.Category) || null;
            let subCategory = subCategoryMap.get(item["Sub Category"]) || null;
            let microCategory = microCategoryMap.get(item["Micro Category"]) || null;

            if (item.Category && !category) {
                err += "Category Not Found. ";
            }
            if (item["Sub Category"] && !subCategory) {
                err += "Sub Category Not Found. ";
            }
            if (item["Sub Category"] && category.id != subCategory.parentId) {
                err += "Sub Category Not Found under this Category."
            }
            if (item["Micro Category"] && !microCategory) {
                err += "Micro Category Not Found. ";
            }
            if (item["Micro Category"] && subCategory.id != microCategory.parentId) {
                err += "Micro Category Not Found under this Sub Category."
            }

            if (err) {
                errorArray.push({ ...item, Error: err });
                continue;
            }
            const updatedObj = {
                itemId
            }
            if (itemName) updatedObj.itemName = itemName;
            if (category) updatedObj.category = category?.id || null;
            if (subCategory) updatedObj.subCategory = subCategory?.id || null;
            if (microCategory) updatedObj.microCategory = microCategory?.id || null;
            if (item.Price) updatedObj.price = item.Price;
            if (item["Min Stock"]) updatedObj.minStock = item["Min Stock"];
            if (item["Max Stock"]) updatedObj.maxStock = item["Max Stock"];
            if (item.Description) updatedObj.description = item.Description;
            if (item["Tax Type"]) updatedObj.taxType = item['Tax Type'] == 'Inclusive' ? 1 : 2;
            if (item.Tax) updatedObj.tax = item.Tax;
            if (item["Item type"]) updatedObj.itemType = item["Item type"] === "Buy" ? 1 : item["Item type"] === "Sell" ? 2 : 3;

            updateData.push(updatedObj);
        }

        if (updateData.length) {
            await Promise.all(
                updateData.map(data =>
                    models.Items.update(data, { where: { itemId: data.itemId, companyId } })
                )
            );
        }

        let msg =
            !errorArray.length
                ? "Bulk Items Edited successfully."
                : errorArray.length !== items.length
                    ? "Few data are Invalid. We Download Those Rows for you."
                    : "All Items are Invalid. We Download Invalid Rows for you.";

        return res.status(200).json({ message: msg, invalidData: errorArray });
    } catch (error) {
        console.error(error);
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

async function bulkUploadAlternateUnit(req, res) {
    try {
        const file = req.file;
        const items = await convertXlsxToJson(file.filename, "alternateUnit");

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: "Empty data found." });
        }

        const errorArray = [], newAlternateUnits = [];
        const itemIds = new Set(), unitCodes = new Set();

        for (const item of items) {
            const { "* Item ID": itemId, "* Base Unit": baseUnit, "* Alternate Unit": alternateUnit } = item;
            if (itemId) itemIds.add(itemId);
            if (baseUnit) unitCodes.add(baseUnit.match(/\((.*?)\)/)?.[1]);
            if (alternateUnit) unitCodes.add(alternateUnit.match(/\((.*?)\)/)?.[1]);
        }

        const [existingItems, uomList] = await Promise.all([
            models.Items.findAll({ where: { itemId: Array.from(itemIds) }, raw: true }),
            models.UOM.findAll({ where: { code: Array.from(unitCodes) }, raw: true }),
        ]);

        const itemMap = new Map(existingItems.map((i) => [i.itemId, i]));
        const uomMap = new Map(uomList.map((u) => [u.code, u.id]));

        console.log(itemMap);

        for (const item of items) {
            let err = "";
            const {
                "* Item ID": itemId,
                "* Base Unit": baseUnit,
                "* Alternate Unit": alternateUnit,
                "* Conversion Factor": conversionFactor,
            } = item;

            const baseUnitCode = baseUnit?.match(/\((.*?)\)/)?.[1];
            const alternateUnitCode = alternateUnit?.match(/\((.*?)\)/)?.[1];

            if (!itemId || !baseUnit || !alternateUnit || !conversionFactor) {
                err += "Required fields are missing. ";
            }
            if (!itemMap.has(itemId.toString())) err += "Item not found. ";
            if (!uomMap.has(baseUnitCode)) err += "Base unit not found. ";
            if (!uomMap.has(alternateUnitCode)) err += "Alternate unit not found. ";

            if (err) {
                errorArray.push({ ...item, Error: err });
                continue;
            }

            newAlternateUnits.push({
                itemId:itemMap.get(itemId.toString())?.id,
                alternateUnits: uomMap.get(alternateUnitCode),
                conversionfactor: conversionFactor,
                status: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }

        if (newAlternateUnits.length) {
            await models.AlternateUnits.bulkCreate(newAlternateUnits);
        }

        const msg = errorArray.length === 0
            ? "Alternate Unit Added Successfully."
            : errorArray.length !== items.length
                ? "Few Rows have Invalid Data. We Download Those Rows for You."
                : "All Rows have Invalid Data. We Download Those Rows for You.";

        return res.status(200).json({ message: msg, invalidData: errorArray });

    } catch (error) {
        return res.status(500).json({ message: "Something went wrong, please try again later!", error });
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
    stockReconcilation: stockReconcilation,
    bulkUploadAlternateUnit: bulkUploadAlternateUnit
}