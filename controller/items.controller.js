const convertXlsxToJson = require('../helpers/bulk-upload');
const { generateTransferNumber } = require('../helpers/transfer-number');
const models = require('../models');
const { Op } = require("sequelize");

function addItem(req, res) {
    const { itemId, itemName, itemType, metricsUnit, companyId, useCustomSeries } = req.body;

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
                    status: 1,
                    customFields: req.body.customField
                };

                models.Items.create(itemData)
                    .then(async (result) => {
                        const newItemId = result.id; // Use the primary key generated for the new item
                        let storeId = req.body.storeId, isRejected = false;
                        if (storeId) {
                            if (storeId?.toString()?.includes('-reject')) {
                                storeId = Number(storeId?.split('-')[0]);
                                isRejected = true;
                            }
                        }
                        // Add entry to StoresItem table
                        const storeItemData = {
                            storeId: storeId,     // storeId from req.body.store
                            itemId: newItemId,  // Use the generated item ID
                            quantity: req.body.currentStock || 0, // Default quantity; adjust if needed
                            addedBy: req.body.userId,
                            status: 1,
                            price: req.body.price || 0,
                            isRejected
                        };

                        req.body.currentStock && await models.StockTransfer.create({
                            transferNumber: generateTransferNumber(),
                            fromStoreId: null,
                            itemId: newItemId,
                            quantity: req.body.currentStock,
                            toStoreId: storeId,
                            transferDate: new Date().toISOString(),
                            transferredBy: req.body.userId,
                            comment: '',
                            companyId,
                            price: req.body.price,
                            isRejected
                        });

                        if (useCustomSeries && itemId) {
                            const prefixMatch = itemId.match(/^[A-Za-z\-]+/);
                            const prefix = prefixMatch ? prefixMatch[0] : null;

                            if (prefix) {
                                await models.ItemSeries.increment(
                                    { nextNumber: 1 },
                                    {
                                        where: {
                                            prefix: prefix,
                                            companyId: companyId
                                        }
                                    }
                                );
                            }
                        }
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
                    subCategory: req.body.subCategory,
                    microCategory: req.body.microCategory,
                    metricsUnit: req.body.metricsUnit,
                    HSNCode: req.body.HSNCode,
                    price: req.body.price,
                    taxType: req.body.taxType,
                    tax: req.body.tax,
                    currentStock: req.body.currentStock,
                    minStock: req.body.minStock,
                    maxStock: req.body.maxStock,
                    description: req.body.description,
                    customFields: req.body.customField,
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

async function deleteItem(req, res) {
    const itemId = req.body.itemId;  // Assuming the team ID is passed as a URL parameter
    models.Items.destroy({ where: { id: itemId } })
        .then(async (result) => {
            if (result) {
                await models.StoreItems.destroy({
                    where: {
                        itemId
                    }
                });
                await models.StockTransfer.destroy({
                    where: {
                        itemId
                    }
                });
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

async function deleteItems(req, res) {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
            message: "Invalid or empty 'items' array in the request payload.",
        });
    }

    try {
        const deletedCount = await models.Items.destroy({
            where: { id: items },
        });

        if (deletedCount > 0) {
            // Delete related StoreItems and StockTransfer entries
            await Promise.all([
                models.StoreItems.destroy({
                    where: { itemId: items },
                }),
                models.StockTransfer.destroy({
                    where: { itemId: items },
                }),
            ]);

            return res.status(200).json({
                message: `${deletedCount} item(s) and related data deleted successfully.`,
            });
        } else {
            return res.status(404).json({
                message: "No items found with the provided IDs.",
            });
        }
    } catch (error) {
        console.error("Error deleting items and related data:", error);
        return res.status(500).json({
            message: "Something went wrong, please try again later!",
            error: error.message,
        });
    }
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

        // Step 2: Retrieve store IDs and quantities for ALL items (rejected + non-rejected)
        const itemIds = items.map(item => item.id);

        const storeItems = await models.StoreItems.findAll({
            where: { itemId: itemIds },
            attributes: ['itemId', 'storeId', 'quantity', 'isRejected'],
            raw: true
        });

        // Step 3: Retrieve alternate units
        const alternateUnits = await models.AlternateUnits.findAll({
            where: { itemId: itemIds },
            attributes: ['itemId', 'alternateUnits', 'conversionfactor', 'ip_address'],
            raw: true
        });

        // Step 4: Structure the response
        const itemsWithStores = items.map(item => {
            const relatedStoreItems = storeItems.filter(si => si.itemId === item.id);

            // Group quantities by store and isRejected
            const storeDataMap = {};
            relatedStoreItems.forEach(({ storeId, quantity, isRejected }) => {
                if (!storeDataMap[storeId]) {
                    storeDataMap[storeId] = { quantity: 0, rejectedQuantity: 0 };
                }
                if (isRejected) {
                    storeDataMap[storeId].rejectedQuantity += quantity;
                } else {
                    storeDataMap[storeId].quantity += quantity;
                }
            });

            const stores = Object.entries(storeDataMap)
                .filter(([_, data]) => data.quantity > 0 || data.rejectedQuantity > 0)
                .map(([storeId, data]) => ({
                    storeId: parseInt(storeId),
                    ...(data?.quantity ? { quantity: data.quantity } : {}),
                    rejectedQuantity: data.rejectedQuantity
                }));

            const itemAlternateUnits = alternateUnits
                .filter(unit => unit.itemId === item.id)
                .map(({ alternateUnits, conversionfactor, ip_address }) => ({
                    alternateUnits,
                    conversionfactor,
                    ip_address
                }));

            return {
                ...item,
                stores,
                alternateUnits: itemAlternateUnits
            };
        });

        res.status(200).json(itemsWithStores);
    } catch (error) {
        console.error(error);
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

        const itemIds = data.map(item => item['* Item ID']?.toString()?.trim());

        const existingItems = await models.Items.findAll({
            where: {
                companyId,
                [Op.or]: [
                    { itemId: { [Op.in]: itemIds } },
                ]
            }
        });

        const itemsMap = {};

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

        const stores = await models.Store.findAll({
            where: {
                companyId: Number(companyId)
            },
            raw: true
        });

        const storesMap = stores?.reduce((acc, curr) => {
            acc[curr.name] = curr;
            return acc;
        }, {});

        const categoryMap = new Map(categories.map(cat => [cat.name, cat]));
        const subCategoryMap = new Map(subCategories.map(sub => [sub.name, sub]));
        const microCategoryMap = new Map(microCategories.map(micro => [micro.name, micro]));

        const uoms = await models.UOM.findAll({});
        const uomMap = new Map(uoms.map(uom => [uom.code, uom.id]));

        const itemsData = [];
        const storeItems = [];
        const stockTransfer = [];

        for (const item of data) {
            const { '* Item ID': itemId, '* Item Name': itemName, '* Item Type': itemType, '* Metrics Unit': metricsUnit } = item;
            if (existingItemMap.has(itemId?.toString())) {
                err = 'Item ID already exists. ';
            }
            if (!itemId || !itemName || !itemType || !metricsUnit) {
                err += 'Required fields are missing. ';
            }

            // if (item?.Price <= 0) {
            //     err += 'Price should be greater than 0. ';
            // }
            if (item?.['Min Stock'] && item?.['Min Stock'] < 0) {
                err += 'Min Stock must be non-negative. ';
            }
            if (item?.['Max Stock'] && item?.['Max Stock'] < 0) {
                err += 'Max Stock must be non-negative. ';
            }

            let category = categoryMap.get(item.Category) || null;
            let subCategory = subCategoryMap.get(item['Sub Category']) || null;
            let microCategory = microCategoryMap.get(item['Micro Category']) || null;
            let uom = uomMap.get(metricsUnit?.toString()?.trim()) || null;

            if (item.Category && !category) {
                err += "Category Not Found. ";
            }
            if (item["Sub Category"] && !subCategory) {
                err += "Sub Category Not Found. ";
            }
            if (item["Sub Category"] && category?.id != subCategory?.parentId) {
                err += "Sub Category Not Found under this Category. "
            }
            if (item["Micro Category"] && !microCategory) {
                err += "Micro Category Not Found. ";
            }
            if (item["Micro Category"] && subCategory?.id != microCategory?.parentId) {
                err += "Micro Category Not Found under this Sub Category. "
            }
            if (!uom) {
                err += "Invalid uom. "
            }

            if (itemsMap?.[itemId]) {
                err += 'Same ItemId found in sheet. ';
            }

            itemsMap[itemId] = 1;

            if (itemId?.toString()?.length > 11) {
                err += 'Item ID must be lesser than or equal to 11 characters.'
            }

            let storeName = '', storeType = '';
            if (item?.Store) {
                const storeStr = item.Store;
                const lastSpaceIndex = storeStr.lastIndexOf(" ");
                storeName = storeStr.slice(0, lastSpaceIndex).trim();
                storeType = storeStr.slice(lastSpaceIndex + 1).trim();
            }

            if (storeName && item['Current Stock']) {
                if (!storesMap[storeName]) {
                    err += 'Store Not Found.';
                }
                else {
                    storeItems.push({
                        storeId: storesMap[storeName]?.id,
                        itemId: itemId?.toString(),
                        quantity: item['Current Stock'],
                        status: 1,
                        addedBy: Number(companyId),
                        price: item['Price'] || 0,
                        isRejected: storeType == '(Reject)'
                    });
                    stockTransfer.push({
                        transferNumber: generateTransferNumber(),
                        fromStoreId: null,
                        itemId: itemId?.toString(),
                        quantity: item['Current Stock'],
                        toStoreId: storesMap[storeName]?.id,
                        transferDate: new Date().toISOString(),
                        transferredBy: Number(companyId),
                        companyId: Number(companyId),
                        price: item['Price'] || 0,
                        isRejected: storeType == '(Reject)'
                    });
                }
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
                metricsUnit: uom,
                category: category?.id || null,
                subCategory: subCategory?.id || null,
                microCategory: microCategory?.id || null,
                HSNCode: item.HSN || null,
                price: item.Price || 0,
                taxType: item['Tax Type'] ? item['Tax Type'] == 'Inclusive' ? 1 : 2 : 1,
                tax: Number(item['Tax']) || 0,
                minStock: item['Min Stock'] || null,
                maxStock: item['Max Stock'] || null,
                description: item['Description'] || null,
                companyId: Number(companyId),
                customFields: item?.customFields,
                status: 1
            });

        }

        if (itemsData.length) {
            const newItems = await models.Items.bulkCreate(itemsData, { returning: true });
            if (storeItems?.length > 0) {
                const newItemsMap = newItems?.reduce((acc, curr) => {
                    acc[curr.itemId] = curr.id;
                    return acc;
                }, {});
                for (let i = 0; i < storeItems.length; ++i) {
                    storeItems[i].itemId = newItemsMap[storeItems[i].itemId];
                    stockTransfer[i].itemId = newItemsMap[stockTransfer[i].itemId];
                }
                await models.StoreItems.bulkCreate(storeItems);
                await models.StockTransfer.bulkCreate(stockTransfer);
            }
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
            if (item?.customFields) updatedObj.customFields = item.customFields
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
    try {
        const file = req.file;
        const items = await convertXlsxToJson(file.filename, 'reconcileStock');
        let isRejected = false;
        if (req.body?.storeId?.toString()?.includes('-reject')) isRejected = true;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: "Empty data found." });
        }

        const errorArray = [];
        const existingItems = await models.Items.findAll({
            where: {
                companyId: Number(req.body.companyId)
            },
            raw: true
        });
        const existingItemsMap = existingItems.reduce((acc, curr) => {
            acc[curr.id] = curr;
            return acc;
        }, {});

        const storeItems = await models.StoreItems.findAll({
            where: {
                storeId: Number(req.body.storeId),
                isRejected,
                quantity: {
                    [Op.gt]: 0
                }
            },
            raw: true
        });

        const currentStockMap = storeItems.reduce((acc, curr) => {
            acc[existingItemsMap[curr.itemId].itemId] = (acc[existingItemsMap[curr.itemId].itemId] || 0) + curr.quantity;
            return acc;
        }, {});

        for (const item of items) {
            const { 'Item ID': itemId, 'Price/Unit': price } = item;
            if (!item['Final Stock']) continue;
            let err = '';
            const existingItem = await models.Items.findOne({
                where: {
                    itemId: itemId,
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
            if (price && Number(price) < 0) {
                err += 'Price Value Should not be negative.'
            }
            if (err) {
                errorArray.push({ ...item, Error: err });
                continue;
            }
            if (Number(item['Final Stock'] || 0) < Number(currentStockMap[itemId?.toString()] || 0)) {
                console.log('inside loop');
                let remainingQuantity = (currentStockMap[itemId?.toString()] - Number(item['Final Stock']));
                const existingStock = await models.StoreItems.findAll({
                    where: { storeId: Number(req.body.storeId?.toString()?.replaceAll('-reject', '')), itemId: existingItem.id, isRejected },
                    order: [['createdAt', 'ASC']],
                });
                for (const stock of existingStock) {
                    if (remainingQuantity <= 0) break;
                    if (stock.quantity <= 0) continue;
                    const deductQty = Math.min(stock.quantity, remainingQuantity);
                    remainingQuantity -= deductQty;

                    await models.StoreItems.update(
                        { quantity: (stock.quantity - deductQty) },
                        { where: { id: stock.id } }
                    );
                }

            }
            const storeItemData = {
                storeId: Number(req.body.storeId?.toString()?.replaceAll('-reject', '')),
                itemId: existingItem.id,
                quantity: Number(item['Final Stock'] || 0) - Number(currentStockMap[itemId?.toString()] || 0),
                addedBy: Number(req.body.companyId),
                status: 1,
                addedBy: Number(req.body.userId),
                price: price,
                isRejected
            };

            const stockTransfer = {
                transferNumber: generateTransferNumber(),
                fromStoreId: (Number(item['Final Stock'] || 0) < Number(currentStockMap[itemId?.toString()] || 0)) ? Number(req.body.storeId?.toString()?.replaceAll('-reject', '')) : null,
                itemId: existingItem.id,
                quantity: Number(item['Final Stock'] || 0) - Number(currentStockMap[itemId?.toString()] || 0),
                toStoreId: (Number(item['Final Stock'] || 0) > Number(currentStockMap[itemId?.toString()] || 0)) ? Number(req.body.storeId?.toString()?.replaceAll('-reject', '')) : null,
                transferDate: new Date().toISOString(),
                transferredBy: Number(req.body.companyId),
                comment: '',
                companyId: Number(req.body.companyId),
                price: price,
                isRejected
            }

            if (Number(item['Final Stock'] || 0) > Number(currentStockMap[itemId?.toString()] || 0)) {
                await models.StoreItems.create(storeItemData);
            }
            await models.StockTransfer.create(stockTransfer);
        }
        msg = !errorArray.length ? 'Stocks Reconcile Successfully.' : errorArray.length != items.length ? 'Few Items are Not Found. We Download Those Rows for you.' : 'All Items are Not Found. We Download Those Rows for you.'
        return res.status(200).json({ message: msg, invalidData: errorArray });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Something went wrong, please try again later!", error, items });
    }
}

async function bulkUploadAlternateUnit(req, res) {
    try {
        const file = req.file;
        const { companyId } = req.body;
        const items = await convertXlsxToJson(file.filename, "alternateUnit");
        // return res.status(200).json({ message: 'Success', invalidData: [] });

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
            models.Items.findAll({ where: { itemId: Array.from(itemIds), companyId: Number(companyId) }, raw: true }),
            models.UOM.findAll({
                where: {
                    [Op.and]: [
                        {
                            [Op.or]: [
                                { companyId: Number(companyId) },
                                { companyId: null, status: 0 }
                            ]
                        },
                        {
                            code: {
                                [Op.in]: Array.from(unitCodes)
                            }
                        }
                    ]
                },
                raw: true
            })
        ]);

        const itemMap = new Map(existingItems.map((i) => [i.itemId, i]));
        const uomMap = new Map(uomList.map((u) => [u.code, u.id]));

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
                itemId: itemMap.get(itemId.toString())?.id,
                alternateUnits: uomMap.get(alternateUnitCode),
                conversionfactor: conversionFactor,
                status: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }

        if (newAlternateUnits.length) {
            await models.AlternateUnits.bulkCreate(newAlternateUnits, {
                updateOnDuplicate: ['conversionfactor']
            });
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