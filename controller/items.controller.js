const convertXlsxToJson = require('../helpers/bulk-upload');
const { generateTransferNumber, generateProductionId } = require('../helpers/transfer-number');
const models = require('../models');
const { Op } = require("sequelize");

async function addItem(req, res) {
    const { itemId, itemName, itemType, metricsUnit, companyId, useCustomSeries, userId } = req.body;

    try {
        // ✅ Mandatory field check
        if (!itemId || !itemName || !itemType || !metricsUnit) {
            return res.status(400).json({
                message: "Mandatory fields are missing: itemId, itemName, itemType, and metricsUnit are required."
            });
        }

        // ✅ Check if item already exists
        const itemResult = await models.Items.findOne({
            where: {
                companyId,
                [models.Sequelize.Op.or]: [
                    { itemId },
                    { itemName }
                ]
            }
        });

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
        }

        // ✅ Prepare item data
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

        // ✅ Create item
        const result = await models.Items.create(itemData);
        const newItemId = result.id;

        // ✅ Store handling
        let storeId = req.body.storeId, isRejected = false;
        if (storeId) {
            if (storeId?.toString()?.includes('-reject')) {
                storeId = Number(storeId.split('-')[0]);
                isRejected = true;
            }
        }

        const settings = await models.Settings.findOne({
            where: {
                companyId: Number(companyId)
            },
            raw: true
        });
        const approvalCount = await models.InventoryApproval.count({
            where: {
                companyId
            }
        });
        const approval = await models.InventoryApproval.create({
            approvalId: `INA${approvalCount + 1}`,
            documentType: 'New Item Added',
            documentNumber: '',
            approvalStatus: settings?.['stockUpdate'] == 'manual' ? 'Pending' : 'Auto Approved',
            requestedBy: userId,
            companyId: companyId,
            status: 1,
            approvedBy: null
        });

        // ✅ Add StockTransfer if currentStock exists
        if (req.body.currentStock) {
            await models.StockTransfer.create({
                transferNumber: generateTransferNumber(),
                fromStoreId: null,
                itemId: newItemId,
                quantity: settings?.['stockUpdate'] == 'manual' ? null : req.body.currentStock,
                toStoreId: storeId,
                transferDate: new Date().toISOString(),
                transferredBy: req.body.userId,
                comment: '',
                companyId,
                price: req.body.price,
                isRejected,
                approvalId: approval.id,
                quantityForApproval: req.body.currentStock
            });
        }

        // ✅ Update ItemSeries if custom series is used
        if (useCustomSeries && itemId) {
            const prefixMatch = itemId.match(/^[A-Za-z\-]+/);
            const prefix = prefixMatch ? prefixMatch[0] : null;

            if (prefix) {
                await models.ItemSeries.increment(
                    { nextNumber: 1 },
                    {
                        where: {
                            prefix,
                            companyId
                        }
                    }
                );
            }
        }

        // ✅ Add to StoreItems
        const storeItemData = {
            storeId,
            itemId: newItemId,
            quantity: settings?.['stockUpdate'] == 'manual' ? 0 : (req.body.currentStock || 0),
            addedBy: req.body.userId,
            status: 1,
            price: req.body.price || 0,
            isRejected,
            approvalId: approval.id,
            quantityForApproval: req.body.currentStock || 0
        };

        req.body?.currentStock && await models.StoreItems.create(storeItemData);

        return res.status(201).json({
            message: "Item added successfully and associated with the store",
            item: result
        });

    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong, please try again later!",
            error
        });
    }
}

async function editItem(req, res) {
    const { id, itemId, itemName, companyId, alternateUnits } = req.body;

    try {
        // Check if itemId or itemName already exists for another item in the same company
        const existingItem = await models.Items.findOne({
            where: {
                companyId: companyId,
                [Op.or]: [{ itemId }],
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

// no content issue code
// async function getItems(req, res) {
//     const { companyId } = req.body;

//     try {
//         // Step 1: Retrieve all items for the given company
//         const items = await models.Items.findAll({
//             where: { companyId },
//             raw: true
//         });

//         if (!items || items.length === 0) {
//             return res.status(200).json([]);
//         }

//         // Step 2: Retrieve store IDs and quantities for ALL items (rejected + non-rejected)
//         const itemIds = items.map(item => item.id);

//         const storeItems = await models.StoreItems.findAll({
//             where: { itemId: itemIds },
//             attributes: ['itemId', 'storeId', 'quantity', 'isRejected'],
//             raw: true
//         });

//         // Step 3: Retrieve alternate units
//         const alternateUnits = await models.AlternateUnits.findAll({
//             where: { itemId: itemIds },
//             attributes: ['itemId', 'alternateUnits', 'conversionfactor', 'ip_address'],
//             raw: true
//         });

//         // Step 4: Structure the response
//         const itemsWithStores = items.map(item => {
//             const relatedStoreItems = storeItems.filter(si => si.itemId === item.id);

//             // Group quantities by store and isRejected
//             const storeDataMap = {};
//             relatedStoreItems.forEach(({ storeId, quantity, isRejected }) => {
//                 if (!storeDataMap[storeId]) {
//                     storeDataMap[storeId] = { quantity: 0, rejectedQuantity: 0 };
//                 }
//                 if (isRejected) {
//                     storeDataMap[storeId].rejectedQuantity += quantity;
//                 } else {
//                     storeDataMap[storeId].quantity += quantity;
//                 }
//             });

//             const stores = Object.entries(storeDataMap)
//                 .filter(([_, data]) => data.quantity > 0 || data.rejectedQuantity > 0)
//                 .map(([storeId, data]) => ({
//                     storeId: parseInt(storeId),
//                     ...(data?.quantity ? { quantity: data.quantity } : {}),
//                     rejectedQuantity: data.rejectedQuantity
//                 }));

//             const itemAlternateUnits = alternateUnits
//                 .filter(unit => unit.itemId === item.id)
//                 .map(({ alternateUnits, conversionfactor, ip_address }) => ({
//                     alternateUnits,
//                     conversionfactor,
//                     ip_address
//                 }));

//             return {
//                 ...item,
//                 stores,
//                 alternateUnits: itemAlternateUnits
//             };
//         });

//         res.status(200).json(itemsWithStores);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             message: "Something went wrong, please try again later!"
//         });
//     }
// }

async function getItems(req, res) {
    const { companyId } = req.body;

    try {
        // Step 1: Retrieve all items for the given company
        const items = await models.Items.findAll({
            where: { companyId },
            raw: true,
        });

        if (!items || items.length === 0) {
            // Explicitly send clean JSON response
            res.setHeader('Content-Type', 'application/json');
            return res.status(200).send('[]');
        }

        // Step 2: Retrieve store IDs and quantities
        const itemIds = items.map((item) => item.id);

        const storeItems = await models.StoreItems.findAll({
            where: { itemId: itemIds },
            attributes: ['itemId', 'storeId', 'quantity', 'isRejected'],
            raw: true,
        });

        // Step 3: Retrieve alternate units
        const alternateUnits = await models.AlternateUnits.findAll({
            where: { itemId: itemIds },
            attributes: ['itemId', 'alternateUnits', 'conversionfactor', 'ip_address'],
            raw: true,
        });

        // Step 4: Structure the response
        const itemsWithStores = items.map((item) => {
            const relatedStoreItems = storeItems.filter((si) => si.itemId === item.id);

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
                    rejectedQuantity: data.rejectedQuantity,
                }));

            const itemAlternateUnits = alternateUnits
                .filter((unit) => unit.itemId === item.id)
                .map(({ alternateUnits, conversionfactor, ip_address }) => ({
                    alternateUnits,
                    conversionfactor,
                    ip_address,
                }));

            return {
                ...item,
                stores,
                alternateUnits: itemAlternateUnits,
            };
        });

        // ✅ Safe response: avoid Content-Length mismatch
        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(JSON.stringify(itemsWithStores));
    } catch (error) {
        console.error(error);
        res
            .status(500)
            .json({ message: 'Something went wrong, please try again later!' });
    }
}


async function addBulkItem(req, res) {
    try {
        const file = req.file;
        const data = await convertXlsxToJson(file.filename, 'bulkUpload');

        if (!data.length) {
            return res.status(400).json({ message: 'Add At Least One Item.' });
        }

        const { companyId, userId } = req.body;
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
            acc[curr.name?.trim()] = curr;
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
        const settings = await models.Settings.findOne({
            where: {
                companyId: Number(companyId)
            },
            raw: true
        });

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
                        quantity: settings?.['stockUpdate'] == 'manual' ? 0 : item['Current Stock'],
                        status: 1,
                        addedBy: Number(userId),
                        price: item['Price'] || 0,
                        isRejected: storeType == '(Reject)',
                        quantityForApproval: item['Current Stock']
                    });
                    stockTransfer.push({
                        transferNumber: generateTransferNumber(),
                        fromStoreId: null,
                        itemId: itemId?.toString(),
                        quantity: settings?.['stockUpdate'] == 'manual' ? null : item['Current Stock'],
                        toStoreId: storesMap[storeName]?.id,
                        transferDate: new Date().toISOString(),
                        transferredBy: Number(userId),
                        companyId: Number(companyId),
                        price: item['Price'] || 0,
                        isRejected: storeType == '(Reject)',
                        quantityForApproval: item['Current Stock']
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
                itemType: itemType === 'Buy' ? 1 : itemType === 'Sell' ? 2 : 3,
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
                const approvalCount = await models.InventoryApproval.count({
                    where: {
                        companyId
                    }
                });
                const approval = await models.InventoryApproval.create({
                    approvalId: `INA${approvalCount + 1}`,
                    documentType: 'Bulk Upload',
                    documentNumber: '',
                    approvalStatus: settings?.['stockUpdate'] == 'manual' ? 'Pending' : 'Auto Approved',
                    requestedBy: userId,
                    companyId: companyId,
                    status: 1,
                    approvedBy: null,
                });
                const newItemsMap = newItems?.reduce((acc, curr) => {
                    acc[curr.itemId] = curr.id;
                    return acc;
                }, {});
                for (let i = 0; i < storeItems.length; ++i) {
                    storeItems[i].itemId = newItemsMap[storeItems[i].itemId];
                    storeItems[i].approvalId = approval.id;
                    stockTransfer[i].itemId = newItemsMap[stockTransfer[i].itemId];
                    stockTransfer[i].approvalId = approval.id;
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
                id: existingItem.id,
                companyId,
                itemId,
                ...(itemName && { itemName }),
                ...(category && { category: category.id }),
                ...(subCategory && { subCategory: subCategory.id }),
                ...(microCategory && { microCategory: microCategory.id }),
                ...(item.Price && { price: item.Price }),
                ...(item["Min Stock"] && { minStock: item["Min Stock"] }),
                ...(item["Max Stock"] && { maxStock: item["Max Stock"] }),
                ...(item.Description && { description: item.Description }),
                ...(item["Tax Type"] && { taxType: item['Tax Type'] === 'Inclusive' ? 1 : 2 }),
                ...(item.Tax && { tax: item.Tax }),
                ...(item["Item type"] && {
                    itemType:
                        item["Item type"] === "Buy" ? 1 :
                            item["Item type"] === "Sell" ? 2 : 3,
                }),
                ...(item?.customFields && { customFields: item.customFields }),
            };
            updateData.push(updatedObj);
        }

        if (updateData.length) {
            await models.Items.bulkCreate(updateData, {
                updateOnDuplicate: [
                    'itemName',
                    'category',
                    'subCategory',
                    'microCategory',
                    'price',
                    'minStock',
                    'maxStock',
                    'description',
                    'taxType',
                    'tax',
                    'itemType',
                    'customFields',
                    'updatedAt'
                ],
            });
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
        const { userId, companyId } = req.body;
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
        const itemIdMap = {};
        const existingItemsMap = existingItems.reduce((acc, curr) => {
            acc[curr.id] = curr;
            itemIdMap[curr.itemId] = curr;
            return acc;
        }, {});

        const storeItems = await models.StoreItems.findAll({
            where: {
                storeId: Number(req.body.storeId?.toString()?.replaceAll("-reject", "")),
                isRejected,
                quantity: {
                    [Op.gt]: 0
                }
            },
            raw: true
        });

        const currentStockMap = storeItems.reduce((acc, curr) => {
            acc[existingItemsMap[curr.itemId]?.itemId] = (acc[existingItemsMap[curr.itemId]?.itemId] || 0) + curr.quantity;
            return acc;
        }, {});

        const settings = await models.Settings.findOne({
            where: {
                companyId: Number(companyId)
            },
            raw: true
        });
        const approvalCount = await models.InventoryApproval.count({
            where: {
                companyId
            }
        });
        const approval = await models.InventoryApproval.create({
            approvalId: `INA${approvalCount + 1}`,
            documentType: 'Physical Stock Reconcilation',
            documentNumber: '',
            approvalStatus: settings?.['stockReconcilation'] == 'manual' ? 'Pending' : 'Auto Approved',
            requestedBy: userId,
            companyId: companyId,
            status: 1,
            approvedBy: null
        });

        const bulkStockTransfers = [], bulkStoreItems = [];

        for (const item of items) {
            const { 'Item ID': itemId, 'Price/Unit': price } = item;
            if (!item['Final Stock'] && item['Final Stock'] != 0) continue;
            let err = '';
            const existingItem = itemIdMap[itemId?.toString()]
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
            if (item['Final Stock'] == currentStockMap[itemId?.toString()]) {
                const storeItems = await models.StoreItems.findAll({
                    where: {
                        itemId: existingItem.id,
                        quantity: {
                            [Op.gt]: 0
                        },
                        storeId: Number(req.body.storeId?.toString()?.replaceAll('-reject', '')),
                        isRejected
                    },
                    raw: true
                });

                const transferNumber = generateTransferNumber()

                bulkStockTransfers.push({
                    transferNumber,
                    fromStoreId: null,
                    itemId: existingItem.id,
                    quantity: item['Final Stock'],
                    toStoreId: Number(req.body.storeId?.toString()?.replaceAll('-reject', '')),
                    transferDate: new Date().toISOString(),
                    transferredBy: userId,
                    comment: '',
                    companyId: Number(req.body.companyId),
                    price: price,
                    isRejected
                });
                for (const element of storeItems) {
                    bulkStockTransfers.push({
                        transferNumber,
                        fromStoreId: Number(req.body.storeId?.toString()?.replaceAll('-reject', '')),
                        itemId: existingItem.id,
                        quantity: element.quantity * -1,
                        toStoreId: null,
                        transferDate: new Date().toISOString(),
                        transferredBy: userId,
                        comment: '',
                        companyId: Number(req.body.companyId),
                        price: element.price,
                        isRejected: element?.isRejected || false
                    });
                    bulkStoreItems.push({ ...element, quantity: 0 });
                }

                bulkStoreItems.push({
                    storeId: Number(req.body.storeId?.toString()?.replaceAll('-reject', '')),
                    itemId: existingItem.id,
                    quantity: Number(item['Final Stock'] || 0),
                    addedBy: Number(req.body.companyId),
                    status: 1,
                    addedBy: Number(userId),
                    price: price,
                    isRejected
                });

                continue;
            }
            if (settings?.['stockReconcilation'] != 'manual') {
                if (Number(item['Final Stock'] || 0) < Number(currentStockMap[itemId?.toString()] || 0)) {
                    let remainingQuantity = (currentStockMap[itemId?.toString()] - Number(item['Final Stock']));
                    const existingStock = await models.StoreItems.findAll({
                        where: { storeId: Number(req.body.storeId?.toString()?.replaceAll('-reject', '')), itemId: existingItem.id, isRejected },
                        order: [['createdAt', 'ASC']],
                        raw: true
                    });
                    for (const stock of existingStock) {
                        if (remainingQuantity <= 0) break;
                        if (stock.quantity <= 0) continue;
                        const deductQty = Math.min(stock.quantity, remainingQuantity);
                        remainingQuantity -= deductQty;
                        bulkStoreItems.push({ ...stock, quantity: (stock.quantity - deductQty) });
                    }
                }
            }
            const storeItemData = {
                storeId: Number(req.body.storeId?.toString()?.replaceAll('-reject', '')),
                itemId: existingItem.id,
                quantity: settings?.['stockReconcilation'] == 'manual' ? 0 : (Number(item['Final Stock'] || 0) - Number(currentStockMap[itemId?.toString()] || 0)),
                addedBy: Number(req.body.companyId),
                status: 1,
                addedBy: Number(userId),
                price: price,
                isRejected,
                approvalId: approval.id,
                quantityForApproval: Number(item['Final Stock'] || 0) - Number(currentStockMap[itemId?.toString()] || 0)
            };

            const stockTransfer = {
                transferNumber: generateTransferNumber(),
                fromStoreId: (Number(item['Final Stock'] || 0) < Number(currentStockMap[itemId?.toString()] || 0)) ? Number(req.body.storeId?.toString()?.replaceAll('-reject', '')) : null,
                itemId: existingItem.id,
                quantity: settings?.['stockReconcilation'] == 'manual' ? null : (Number(item['Final Stock'] || 0) - Number(currentStockMap[itemId?.toString()] || 0)),
                toStoreId: (Number(item['Final Stock'] || 0) > Number(currentStockMap[itemId?.toString()] || 0)) ? Number(req.body.storeId?.toString()?.replaceAll('-reject', '')) : null,
                transferDate: new Date().toISOString(),
                transferredBy: Number(userId),
                comment: '',
                companyId: Number(req.body.companyId),
                price: price,
                isRejected,
                approvalId: approval.id,
                quantityForApproval: Number(item['Final Stock'] || 0) - Number(currentStockMap[itemId?.toString()] || 0)
            }

            if (Number(item['Final Stock'] || 0) > Number(currentStockMap[itemId?.toString()] || 0)) {
                // await models.StoreItems.create(storeItemData);
                bulkStoreItems.push(storeItemData);
            }
            // await models.StockTransfer.create(stockTransfer);
            bulkStockTransfers.push(stockTransfer);
        }
        await models.StockTransfer.bulkCreate(bulkStockTransfers);
        await models.StoreItems.bulkCreate(bulkStoreItems, {
            updateOnDuplicate: ['quantity']
        });
        msg = !errorArray.length ? settings?.['stockReconcilation'] != 'manual' ? 'Stocks Reconcile Successfully.' : 'Inventory Approval generated for current request.' : errorArray.length != items.length ? 'Few Items are Not Found. We Download Those Rows for you.' : 'All Items are Not Found. We Download Those Rows for you.'
        return res.status(200).json({ message: msg, invalidData: errorArray });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Something went wrong, please try again later!", error });
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

async function bulkStockUpdate(req, res) {
    try {
        const { companyId, userId } = req.body;
        const file = req.file;
        const rows = await convertXlsxToJson(file.filename, "bulkStockUpdate");
        const items = await models.Items.findAll({
            where: {
                companyId: Number(companyId)
            },
            raw: true
        });
        const itemIdMap = {}, itemMap = {}, itemNameMap = {};
        for (const element of items) {
            itemMap[element.id] = element;
            itemIdMap[element.itemId?.toLowerCase()] = element;
            itemNameMap[element?.itemName?.toLowerCase()?.trim()] = element;
        }
        const stores = await models.Store.findAll({
            where: {
                companyId: Number(companyId)
            },
            raw: true
        });
        const storeMap = stores.reduce((acc, curr) => {
            acc[curr.name] = curr;
            return acc;
        }, {});
        let fromItemName = false;
        if (Object.keys(rows[0])?.includes('Item')) {
            fromItemName = true;
        }
        const storeItems = await models.StoreItems.findAll({
            where: {
                storeId: {
                    [Op.in]: stores.map(store => store.id),
                },
                quantity: {
                    [Op.gt]: 0
                }
            },
            raw: true
        });
        const quantityMap = {};
        for (const element of storeItems) {
            if (!quantityMap[element.itemId]) quantityMap[element.itemId] = {};
            if (!quantityMap[element.itemId][element.storeId]) quantityMap[element.itemId][element.storeId] = {};
            if (element?.isRejected) {
                quantityMap[element.itemId][element.storeId].rejectedQuantity = (quantityMap[element.itemId][element.storeId].rejectedQuantity || 0) + element.quantity;
            } else {
                quantityMap[element.itemId][element.storeId].quantity = (quantityMap[element.itemId][element.storeId].quantity || 0) + element.quantity;
            }
        }
        const errorArray = [], bulkStockTransfer = [], bulkStoreItems = [];
        const settings = await models.Settings.findOne({
            where: {
                companyId: Number(companyId)
            },
            raw: true
        });
        const approvalCount = await models.InventoryApproval.count({
            where: {
                companyId
            }
        });
        const approval = await models.InventoryApproval.create({
            approvalId: `INA${approvalCount + 1}`,
            documentType: 'Stock Update',
            documentNumber: '',
            approvalStatus: settings?.['stockUpdate'] == 'manual' ? 'Pending' : 'Auto Approved',
            requestedBy: userId,
            companyId: companyId,
            status: 1,
            approvedBy: null
        });
        for (const element of rows) {
            let error = '';
            if (!element.Quantity) error += 'Quantity is required. ';
            if (!element.Price && element.Price != 0) error += 'Price is required. ';
            if (!element.Store) error += 'Store is required. ';
            const itemName = fromItemName ? element.Item.substring(0, element.Item.lastIndexOf("(")).trim() : element['Item Name/Id'];
            if (!itemName) error += 'Item is required. ';
            const selectedItem = itemIdMap[itemName?.toString()?.toLowerCase()] || itemNameMap[itemName?.toLowerCase()]
            if (!selectedItem) error += 'Item not found. ';
            const isReject = element.Store.includes('(Reject)');
            const storeName = element.Store.substring(0, element.Store.lastIndexOf("(") - 1);
            const store = storeMap[storeName];
            if (!store) error += 'Store not found. ';
            if (error) {
                errorArray.push({ ...element, Error: error });
                continue;
            }
            if (element?.Type?.toLowerCase() === 'reduce') {
                if (!quantityMap?.[selectedItem.id]?.[store.id] || element.Quantity > (isReject ? quantityMap?.[selectedItem.id]?.[store.id]?.rejectedQuantity : quantityMap?.[selectedItem.id]?.[store.id].quantity)) {
                    error += 'Quantity is not available in Store.';
                    errorArray.push({ ...element, Error: error });
                    continue;
                }
                const existingStock = await models.StoreItems.findAll({
                    where: { storeId: (store.id), itemId: selectedItem.id, isRejected: isReject },
                    order: [['createdAt', 'ASC']],
                });
                let remainingQuantity = element.Quantity;
                const transferNumber = generateTransferNumber();
                if (settings?.['stockUpdate'] != 'manual') {
                    for (const stock of existingStock) {
                        if (remainingQuantity <= 0) break;
                        if (stock.quantity <= 0) continue;
                        const deductQty = Math.min(stock.quantity, remainingQuantity);
                        remainingQuantity -= deductQty;
                        await models.StoreItems.update(
                            { quantity: (stock.quantity - deductQty) },
                            { where: { id: stock.id } }
                        );
                        bulkStockTransfer.push({
                            fromStoreId: store.id,
                            transferNumber,
                            toStoreId: null,
                            itemId: selectedItem.id,
                            quantity: -deductQty,
                            status: 1,
                            addedBy: userId,
                            price: element.Price,
                            isRejected: isReject,
                            comment: element.Comment,
                            transferDate: new Date().toISOString(),
                            transferredBy: Number(userId),
                            companyId: Number(companyId),
                            actualPrice: stock.price,
                            approvalId: approval.id,
                            quantityForApproval: element.Quantity
                        })
                    }
                } else {
                    bulkStockTransfer.push({
                        fromStoreId: store.id,
                        transferNumber,
                        toStoreId: null,
                        itemId: selectedItem.id,
                        quantity: null,
                        status: 1,
                        addedBy: userId,
                        price: element.Price,
                        isRejected: isReject,
                        comment: element.Comment,
                        transferDate: new Date().toISOString(),
                        transferredBy: Number(userId),
                        companyId: Number(companyId),
                        approvalId: approval.id,
                        quantityForApproval: -element.Quantity
                    })
                }
            }
            else {
                bulkStockTransfer.push({
                    toStoreId: store.id,
                    fromStoreId: null,
                    itemId: selectedItem.id,
                    quantity: settings?.['stockUpdate'] == 'manual' ? null : element.Quantity,
                    status: 1,
                    addedBy: userId,
                    price: element.Price,
                    isRejected: isReject,
                    comment: element.Comment,
                    transferDate: new Date().toISOString(),
                    transferredBy: Number(userId),
                    companyId: Number(companyId),
                    approvalId: approval.id,
                    quantityForApproval: element.Quantity
                });
                bulkStoreItems.push({
                    storeId: store.id,
                    itemId: selectedItem.id,
                    quantity: settings?.['stockUpdate'] == 'manual' ? 0 : element.Quantity,
                    status: 1,
                    addedBy: userId,
                    price: element?.Price,
                    isRejected: isReject,
                    approvalId: approval.id,
                    quantityForApproval: element.Quantity
                })
            }

        }

        if (bulkStockTransfer.length) {
            await models.StockTransfer.bulkCreate(bulkStockTransfer);
            await models.StoreItems.bulkCreate(bulkStoreItems);
        }
        const msg = !errorArray.length
            ? settings?.['stockUpdate'] != 'manual' ? 'Bulk Stock updated successfully.' :
                'Inventory Approval generated for current request.'
            : errorArray.length !== rows.length
                ? settings?.['stockUpdate'] != 'manual' ? 'Bulk Stock updated successfully. Some rows contain invalid data. We Download Those Rows for you.' :
                    'Inventory Approval generated for current request. Some rows contain invalid data. We Download Those Rows for you.'
                : 'All rows contain invalid data. We Download Those Rows for you.';

        res.status(200).json({ message: msg, invalidData: errorArray });
    } catch (error) {
        console.log(error);
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
    bulkUploadAlternateUnit: bulkUploadAlternateUnit,
    bulkStockUpdate: bulkStockUpdate
}