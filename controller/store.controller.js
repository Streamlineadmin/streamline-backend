const { generateProductionId } = require("../helpers/transfer-number");
const models = require("../models");
const { Op, Sequelize } = require('sequelize');

async function addStore(req, res) {
  try {
    // Check if store name already exists for the company
    const storeResult = await models.Store.findOne({
      where: {
        name: req.body.storeName,
        companyId: req.body.companyId
      }
    });

    if (storeResult) {
      return res.status(409).json({
        message: "Store name already exists!"
      });
    }

    const existingStoreCount = await models.Store.count({
      where: {
        companyId: req.body.companyId
      }
    });

    const store = {
      companyId: req.body.companyId,
      name: req.body.storeName,
      ip_address: req.body.ip_address,
      addressLineOne: req.body.addressLineOne,
      addressLineTwo: req.body.addressLineTwo,
      pincode: req.body.pinCode,
      storeType: req.body.storeType,
      city: req.body.city,
      state: req.body.state,
      country: req.body.country,
      status: 1,
      default: existingStoreCount === 0
    };

    const result = await models.Store.create(store);

    return res.status(201).json({
      message: "Store added successfully",
      post: result
    });

  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong, please try again later!",
      error
    });
  }
}


function editStore(req, res) {
  const storeId = req.body.storeId;

  const updatedStoreData = {
    companyId: req.body.companyId,
    name: req.body.name,
    ip_address: req.body.ip_address,
    addressLineOne: req.body.addressLineOne,
    addressLineTwo: req.body.addressLineTwo,
    pincode: req.body.pincode,
    city: req.body.city,
    state: req.body.state,
    country: req.body.country,
    storeType: req.body.storeType,
    status: req.body.status || 1,
  };

  // Check if store name already exists for another store in the same company
  models.Store.findOne({
    where: {
      name: req.body.name,
      companyId: req.body.companyId,
      id: { [models.Sequelize.Op.ne]: storeId }, // Exclude current store
    },
  })
    .then((storeResult) => {
      if (storeResult) {
        return res.status(409).json({
          message: "Store name already exists!",
        });
      } else {
        // Proceed to update the store if no conflicts are found
        models.Store.update(updatedStoreData, { where: { id: storeId } })
          .then((result) => {
            if (result[0] > 0) {
              res.status(200).json({
                message: "Store updated successfully",
                post: updatedStoreData,
              });
            } else {
              res.status(404).json({
                message: "Store not found",
              });
            }
          })
          .catch((error) => {
            res.status(500).json({
              message: "Something went wrong, please try again later!",
              error: error,
            });
          });
      }
    })
    .catch((error) => {
      res.status(500).json({
        message: "Something went wrong, please try again later!",
        error: error,
      });
    });
}

async function deleteStore(req, res) {
  const storeId = req.body.storeId;
  const store = await models.Store.findOne({
    where: {
      id: storeId
    }
  });
  if (!store) return res.status(404).json({
    message: "Store Not found.",
  });

  const storeItems = await models.StoreItems.findAll({
    where: {
      storeId,
      quantity: { [models.Sequelize.Op.gt]: 0 }
    }
  });
  if (storeItems?.length > 0) return res.status(409).json({
    message: "Store contain one or more Items. You can not delete this Store."
  });
  models.Store.destroy({ where: { id: storeId } })
    .then((result) => {
      if (result) {
        res.status(200).json({
          message: "Store deleted successfully",
        });
      } else {
        res.status(200).json({
          message: "Something went wrong, please try again later!",
        });
      }
    })
    .catch((error) => {
      res.status(500).json({
        message: "Something went wrong, please try again later!",
        error: error,
      });
    });
}

function getStoresById(req, res) {
  const id = req.body.id;

  models.Store.findByPk(id)
    .then((result) => {
      res.status(200).json(result);
    })
    .catch((error) => {
      res.status(500).json({
        message: "something went wrong, please try again later!",
      });
    });
}

async function getStores(req, res) {
  const { companyId } = req.body;

  if (!companyId) {
    return res.status(400).json({
      message: "companyId is required in the request body",
    });
  }

  try {
    // 1️⃣ Fetch all stores for the company
    const stores = await models.Store.findAll({
      where: { companyId },
      raw: true, // lightweight objects, no .toJSON() needed
    });

    if (!stores.length) {
      return res.status(200).json([]);
    }

    const storeIds = stores.map(s => s.id);

    // 2️⃣ Fetch all store items for these stores (both rejected + non-rejected)
    const storeItems = await models.StoreItems.findAll({
      where: { storeId: storeIds },
      attributes: ["storeId", "itemId", "quantity", "isRejected"],
      raw: true,
    });

    // 3️⃣ Pre-group items by store
    const storeMap = {};
    for (const { storeId, itemId, quantity, isRejected } of storeItems) {
      if (!storeMap[storeId]) {
        storeMap[storeId] = { itemsMap: {}, rejectedMap: {} };
      }
      const map = isRejected ? storeMap[storeId].rejectedMap : storeMap[storeId].itemsMap;
      map[itemId] = (map[itemId] || 0) + quantity;
    }

    // 4️⃣ Build response
    const storesWithItemCount = stores.map(store => {
      const { itemsMap = {}, rejectedMap = {} } = storeMap[store.id] || {};
      const itemCount = Object.values(itemsMap).filter(qty => qty > 0).length;
      const rejectedItemCount = Object.values(rejectedMap).filter(qty => qty > 0).length;

      return {
        ...store,
        itemCount,
        rejectedItemCount,
      };
    });

    res.status(200).json(storesWithItemCount);

  } catch (error) {
    console.error("Error fetching stores:", error);
    res.status(500).json({
      message: "Something went wrong, please try again later!",
      error: error.message,
    });
  }
}


async function getStoresByItem(req, res) {
  const { itemId } = req.body;

  // Step 1: Check if itemId is provided
  if (!itemId) {
    return res.status(400).json({
      message: 'itemId is required in the request body',
    });
  }

  try {
    // Step 2: Find all storeIds that have the given itemId in StoreItems
    const storeItems = await models.StoreItems.findAll({
      where: { itemId },
      attributes: ['storeId', 'quantity', 'isRejected'],
    });

    // Check if any store was found for the given itemId
    if (storeItems.length === 0) {
      return res.status(200).json([]);
    }

    // Aggregate the quantities for each storeId
    const rejectStoreQuantities = {};
    const storeQuantities = storeItems.reduce((acc, { storeId, quantity, isRejected }) => {
      if (!isRejected) acc[storeId] = (acc[storeId] || 0) + quantity;
      else rejectStoreQuantities[storeId] = (rejectStoreQuantities[storeId] || 0) + quantity;
      return acc;
    }, {});

    // Step 3: Filter out stores with a total negative quantity
    const validStoreIds = Object.entries(storeQuantities)
      .filter(([_, quantity]) => quantity > 0)
      .map(([storeId]) => parseInt(storeId));

    const validRejectStoreIds = Object.entries(rejectStoreQuantities)
      .filter(([_, quantity]) => quantity > 0)
      .map(([storeId]) => parseInt(storeId));

    // If no stores have positive quantities
    // if (validStoreIds.length === 0) {
    //   return res.status(404).json({
    //     message: `No stores with positive quantity found for itemId ${itemId}`,
    //   });
    // }

    // Step 4: Retrieve store details from Stores table based on valid storeIds
    const stores = await models.Store.findAll({
      where: { id: [...validStoreIds, ...validRejectStoreIds] },
      attributes: ['id', 'name'], // Specify the columns you want from Store
    });

    // Step 5: Combine the store data with the total quantities
    const storesWithItemDetails = [];
    stores.forEach(store => {
      if (storeQuantities[store.id]) {
        storesWithItemDetails.push({
          storeId: store.id,
          storeName: store.name,
          quantity: storeQuantities[store.id] || 0,
          isReject: false,
          itemId
        });
      }

      if (rejectStoreQuantities[store.id]) {
        storesWithItemDetails.push({
          storeId: store.id,
          storeName: store.name,
          quantity: rejectStoreQuantities[store.id] || 0,
          isReject: true,
          itemId
        });
      }
    });

    // Step 6: Send the combined response
    res.status(200).json(storesWithItemDetails);
  } catch (error) {
    // Catch and log any errors that happen during the process
    console.error('Error fetching stores with itemId:', error);
    res.status(500).json({
      message: 'Something went wrong, please try again later!',
      error: error.message, // Include the error message for debugging
    });
  }
}

async function stockTransfer(req, res) {
  const { transferNumber, stockData, transferDate, transferredBy, companyId, useFIFO, comment, userId } = req.body;

  try {
    // Iterate through each stock transfer item
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
    const inventoryHandling = stockData?.[0]?.addReduce ? settings?.['stockUpdate'] : settings?.['stockTransfer'];
    const approval = await models.InventoryApproval.create({
      approvalId: `INA${approvalCount + 1}`,
      documentType: useFIFO ? 'Stock Update' : 'Stock Transfer',
      documentNumber: '',
      approvalStatus: inventoryHandling == 'manual' ? 'Pending' : 'Auto Approved',
      requestedBy: userId,
      companyId: companyId,
      status: 1,
      approvedBy: null
    });


    for (const element of stockData) {
      let price = 0;
      let remainingQuantity = element.quantity * (element?.conversionFactor || 1);
      const addReduce = element.addReduce;
      if ((useFIFO && addReduce == 2) || !addReduce) {
        // Fetch existing stock based on FIFO (oldest stock first)
        if (inventoryHandling != 'manual') {
          const existingStock = await models.StoreItems.findAll({
            where: { storeId: (element.fromStore || element.toStore), itemId: element.itemId, isRejected: (element?.isReject || false) },
            order: [['createdAt', 'ASC']], // Oldest entries first
          });
          for (const stock of existingStock) {
            if (remainingQuantity <= 0) break;
            if (stock.quantity <= 0) continue;
            const deductQty = Math.min(stock.quantity, remainingQuantity);
            remainingQuantity -= deductQty;

            // Reduce quantity from source store
            await models.StoreItems.update(
              { quantity: (stock.quantity - deductQty) },
              { where: { id: stock.id } }
            );

            if (!addReduce) {
              await models.StoreItems.create({
                storeId: element.toStore,
                itemId: element.itemId,
                quantity: deductQty,
                status: 1,
                addedBy: transferredBy,
                price: stock.price,
                isRejected: element?.toReject || false,
                approvalId: approval.id,
                quantityForApproval: deductQty
              });

              if (element?.toStore == element?.fromStore) {
                await models.StockTransfer.create({
                  transferNumber,
                  fromStoreId: element?.fromStore,
                  itemId: element.itemId,
                  quantity: deductQty,
                  toStoreId: element.toStore,
                  transferDate: element.transferDate || transferDate,
                  transferredBy,
                  comment: element.comment || comment,
                  companyId,
                  price: stock.price,
                  isRejected: element?.toReject || false,
                  approvalId: approval.id,
                  quantityForApproval: deductQty
                });
                await models.StockTransfer.create({
                  transferNumber,
                  fromStoreId: element?.fromStore,
                  itemId: element.itemId,
                  quantity: deductQty * -1,
                  toStoreId: element.toStore,
                  transferDate: element.transferDate || transferDate,
                  transferredBy,
                  comment: element.comment || comment,
                  companyId,
                  price: stock.price,
                  isRejected: element?.toReject ? false : true,
                  approvalId: approval.id,
                  quantityForApproval: deductQty
                });

              }

              else {
                await models.StockTransfer.create({
                  transferNumber,
                  fromStoreId: element?.fromStore,
                  itemId: element.itemId,
                  quantity: deductQty,
                  toStoreId: element.toStore,
                  transferDate: element.transferDate || transferDate,
                  transferredBy,
                  comment: element.comment || comment,
                  companyId,
                  price: stock.price,
                  isRejected: element?.toReject || false,
                  approvalId: approval.id,
                  quantityForApproval: deductQty,
                  toReject: element?.toReject || false
                });
              }

            }

            addReduce && await models.StockTransfer.create({
              transferNumber,
              fromStoreId: !addReduce ? element?.fromStore : addReduce == 2 ? element?.toStore : (element?.fromStore || null),
              itemId: element.itemId,
              quantity: -deductQty,
              toStoreId: !addReduce ? element?.toStore : addReduce == 2 ? null : element.toStore,
              transferDate: element.transferDate || transferDate,
              transferredBy,
              comment: element.comment || comment,
              companyId,
              price: (!addReduce ? stock.price : element?.price / (element?.conversionFactor || 1)),
              isRejected: element?.isReject || false,
              approvalId: approval.id,
              quantityForApproval: -deductQty
            });

            price += (stock.price * deductQty);
          }
        }
        else {
          await models.StockTransfer.create({
            transferNumber,
            fromStoreId: !addReduce ? element?.fromStore : addReduce == 2 ? element?.toStore : (element?.fromStore || null),
            itemId: element.itemId,
            quantity: null,
            toStoreId: !addReduce ? element?.toStore : addReduce == 2 ? null : element.toStore,
            transferDate: element.transferDate || transferDate,
            transferredBy,
            comment: element.comment || comment,
            companyId,
            price: 0,
            isRejected: element?.isReject || false,
            approvalId: approval.id,
            quantityForApproval: -remainingQuantity,
            toReject: element?.toReject || false
          });
        }
      }

      if (addReduce && addReduce != 2) {
        await models.StockTransfer.create({
          transferNumber,
          fromStoreId: element?.fromStore || null,
          itemId: element.itemId,
          quantity: settings?.['stockUpdate'] == 'manual' ? null : (element.quantity * (element?.conversionFactor || 1)),
          toStoreId: element.toStore,
          transferDate: element.transferDate || transferDate,
          transferredBy,
          comment: element.comment || comment,
          companyId,
          price: element.price / (element?.conversionFactor || 1),
          isRejected: element?.isReject || false,
          approvalId: approval.id,
          quantityForApproval: element.quantity * (element?.conversionFactor || 1)
        });
      }

      // Add quantity to destination store for Add operations
      if (addReduce && addReduce != 2) {
        await models.StoreItems.create({
          storeId: element.toStore,
          itemId: element.itemId,
          quantity: settings?.['stockUpdate'] == 'manual' ? 0 : (element.quantity * (element?.conversionFactor || 1)),
          status: 1,
          addedBy: transferredBy,
          price: element?.price / (element?.conversionFactor || 1),
          isRejected: element?.isReject || false,
          approvalId: approval.id,
          quantityForApproval: element.quantity * (element?.conversionFactor || 1)
        });
      }
    }

    res.status(201).json({
      message: inventoryHandling == 'manual' ? 'Inventory Approval Requested.' : "Stock transfer completed successfully with FIFO handling",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Something went wrong, please try again later!",
      error,
    });
  }
}

async function getItemStockTransferHistory(req, res) {
  const { itemId, isRejected = false } = req.body;

  if (!itemId) {
    return res.status(400).json({ message: "itemId is required" });
  }

  try {
    // Step 1: Fetch stock transfers, item, stores, and users in parallel
    const stockTransfers = await models.StockTransfer.findAll({
      where: {
        itemId, isRejected,
        quantity: {
          [Op.and]: [
            { [Op.ne]: null },
            { [Op.ne]: 0 }
          ]
        }
      },
      attributes: [
        'createdAt', 'transferNumber', 'quantity', 'itemId',
        'fromStoreId', 'toStoreId', 'transferredBy', 'comment',
        'price', 'documentNumber', 'documentType',
        'productionId', 'productionNavigationId', 'isRejected', "updatedAt"
      ],
      order: [['createdAt', 'ASC']],
      raw: true,
    });

    if (!stockTransfers.length) {
      return res.status(200).json({
        message: `No stock transfers found for itemId ${itemId}`,
        stockTransfers: [],
      });
    }

    // Get unique store IDs and user IDs
    const storeIds = new Set();
    const userIds = new Set();
    stockTransfers.forEach(t => {
      storeIds.add(t.fromStoreId);
      storeIds.add(t.toStoreId);
      userIds.add(t.transferredBy);
    });

    // Fetch item, stores, and users in parallel
    const [item, stores, users] = await Promise.all([
      models.Items.findOne({
        where: { id: itemId },
        attributes: ['id', 'itemName', 'itemId'],
        raw: true
      }),
      models.Store.findAll({
        where: { id: [...storeIds] },
        attributes: ['id', 'name'],
        raw: true
      }),
      models.Users.findAll({
        where: { id: [...userIds] },
        attributes: ['id', 'name'],
        raw: true
      }),
    ]);

    if (!item) {
      return res.status(404).json({ message: `No item found with itemId ${itemId}` });
    }

    // Map stores and users
    const storeMap = Object.fromEntries(stores.map(s => [s.id, s.name]));
    const userMap = Object.fromEntries(users.map(u => [u.id, u.name]));

    // Step 2: Track cumulative quantities per store efficiently
    const storeQuantities = {};
    const enrichedTransfers = stockTransfers.map(t => {
      const from = t.fromStoreId;
      const to = t.toStoreId;
      const qty = t.quantity;

      if (!(from in storeQuantities)) storeQuantities[from] = 0;
      if (!(to in storeQuantities)) storeQuantities[to] = 0;

      const sameStore = from === to;
      const fromPrev = storeQuantities[from];
      const toPrev = storeQuantities[to];

      if (sameStore) {
        storeQuantities[from] += qty;
      } else {
        storeQuantities[from] += qty < 0 ? qty : -qty;
        storeQuantities[to] += qty > 0 ? qty : -qty;
      }

      return {
        ...t,
        itemName: item.itemName,
        fromStore: {
          name: storeMap[from] || 'Unknown Store',
          previousQuantity: fromPrev,
          currentQuantity: storeQuantities[from]
        },
        toStore: {
          name: storeMap[to] || 'Unknown Store',
          previousQuantity: toPrev,
          currentQuantity: storeQuantities[to]
        },
        transferredBy: userMap[t.transferredBy] || 'Unknown User',
      };
    });

    return res.status(200).json({
      message: "Stock transfers fetched successfully",
      stockTransfers: enrichedTransfers,
    });

  } catch (error) {
    console.error("Error fetching stock transfers:", error);
    return res.status(500).json({
      message: "Something went wrong, please try again later!",
      error: error.message
    });
  }
}



async function getStockTransferHistory(req, res) {
  const { companyId } = req.body; // Extract companyId from the payload

  if (!companyId) {
    return res.status(400).json({
      message: "companyId is required",
    });
  }

  try {
    // Fetch stock transfers for the given companyId
    const stockTransfers = await models.StockTransfer.findAll({
      where: { companyId },
      attributes: [
        'id',
        'createdAt',
        'transferNumber',
        'quantity',
        'itemId',
        'fromStoreId',
        'toStoreId',
        'transferredBy',
        'comment',
      ],
      order: [['createdAt', 'ASC']], // Order by time for cumulative calculations
      raw: true,
    });

    if (!stockTransfers.length) {
      return res.status(404).json({
        message: `No stock transfers found for companyId ${companyId}.`,
      });
    }

    // Fetch item details for all unique item IDs in stockTransfers
    const itemIds = [...new Set(stockTransfers.map(transfer => transfer.itemId))];
    const items = await models.Items.findAll({
      where: { id: itemIds },
      attributes: ['id', 'itemName'],
    });

    // Map valid item IDs
    const validItemIds = new Set(items.map(item => item.id));

    // Filter out stock transfers with invalid item IDs
    const validStockTransfers = stockTransfers.filter(transfer =>
      validItemIds.has(transfer.itemId)
    );

    if (!validStockTransfers.length) {
      return res.status(404).json({
        message: `No valid stock transfers found for companyId ${companyId}.`,
      });
    }

    // Map item IDs to item names
    const itemMap = items.reduce((map, item) => {
      map[item.id] = item.itemName;
      return map;
    }, {});

    // Create cumulative quantities for all stores
    const storeQuantities = {};

    const enrichedTransfers = validStockTransfers.map(transfer => {
      // Initialize cumulative quantities for `fromStore` and `toStore`
      if (!storeQuantities[transfer.fromStoreId]) {
        storeQuantities[transfer.fromStoreId] = 0;
      }
      if (!storeQuantities[transfer.toStoreId]) {
        storeQuantities[transfer.toStoreId] = 0;
      }

      // Calculate previous and current quantities for `fromStore`
      const fromStorePreviousQuantity = storeQuantities[transfer.fromStoreId];
      storeQuantities[transfer.fromStoreId] -= transfer.quantity;
      const fromStoreCurrentQuantity = storeQuantities[transfer.fromStoreId];

      // Calculate previous and current quantities for `toStore`
      const toStorePreviousQuantity = storeQuantities[transfer.toStoreId];
      storeQuantities[transfer.toStoreId] += transfer.quantity;
      const toStoreCurrentQuantity = storeQuantities[transfer.toStoreId];

      // Enrich the transfer record
      return {
        createdAt: transfer.createdAt,
        transferNumber: transfer.transferNumber,
        quantity: transfer.quantity,
        itemName: itemMap[transfer.itemId] || 'Unknown Item',
        itemId: transfer.itemId,
        fromStoreId: transfer.fromStoreId,
        toStoreId: transfer.toStoreId,
        transferredBy: transfer.transferredBy,
        comment: transfer.comment,
        fromStore: {
          previousQuantity: fromStorePreviousQuantity,
          currentQuantity: fromStoreCurrentQuantity,
        },
        toStore: {
          previousQuantity: toStorePreviousQuantity,
          currentQuantity: toStoreCurrentQuantity,
        },
      };
    });

    res.status(200).json({
      message: "Valid stock transfers fetched successfully",
      stockTransfers: enrichedTransfers,
    });
  } catch (error) {
    console.error("Error fetching stock transfers:", error);
    res.status(500).json({
      message: "Something went wrong, please try again later!",
      error: error.message,
    });
  }
}

async function getStoreItemsByStoreId(req, res) {
  const { storeId, isRejected = false, fromfetch } = req.body;
  if (!storeId) return res.status(404).json({ message: "Store Not found." });

  try {
    // Fetch StoreItems and UOMs
    const [storeItemsRaw, uomData] = await Promise.all([
      models.StoreItems.findAll({
        where: {
          storeId, isRejected, quantity: {
            [Op.gt]: 0
          }
        },
        raw: true,

      }),
      models.UOM.findAll({ raw: true })
    ]);

    // Map UOM IDs to codes
    const uomMap = uomData.reduce((map, uom) => {
      map[uom.id] = uom.code;
      return map;
    }, {});

    const itemQuantityMap = {};
    const itemPriceMap = {};
    const uniqueStoreItems = {};

    for (const item of storeItemsRaw) {
      const itemId = item.itemId;
      const quantity = item.quantity;
      const price = item.price;

      // Aggregate quantity and price
      itemQuantityMap[itemId] = (itemQuantityMap[itemId] || 0) + quantity;
      if (quantity > 0) {
        itemPriceMap[itemId] = (itemPriceMap[itemId] || 0) + (price * quantity);
      }

      // Store one instance of each item
      if (!uniqueStoreItems[itemId]) {
        uniqueStoreItems[itemId] = item;
      }
    }

    const itemIds = Object.keys(uniqueStoreItems);

    // Fetch item data and alternate units in bulk
    const [itemsData, alternateUnitsData] = await Promise.all([
      models.Items.findAll({
        where: { id: itemIds },
        raw: true
      }),
      models.AlternateUnits.findAll({
        where: { itemId: itemIds },
        raw: true
      })
    ]);

    // Map alternate units by itemId
    const alternateUnitsMap = alternateUnitsData.reduce((acc, unit) => {
      const itemId = unit.itemId;
      const unitWithCode = { ...unit, code: uomMap[unit.alternateUnits] || null };
      acc[itemId] = acc[itemId] || [];
      acc[itemId].push(unitWithCode);
      return acc;
    }, {});

    // Build final store items
    const storeItems = itemIds.map(itemId => {
      const baseItem = uniqueStoreItems[itemId];
      return {
        ...baseItem,
        quantity: itemQuantityMap[itemId],
        averagePrice: itemPriceMap[itemId] || 0,
        itemId: {
          ...itemsData.find(item => item.id === Number(itemId)),
          alternateUnit: alternateUnitsMap[itemId] || []
        }
      };
    });

    return res.status(200).json({ storeItems, ...(fromfetch ? { fromfetch: true } : {}) });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong." });
  }
}

async function getAllStoreItemsByStoresID(req, res) {
  let { storeIds, isRejected } = req.body;

  try {
    // Step 1: Get all store IDs if not provided
    if (!Array.isArray(storeIds) || storeIds.length === 0) {
      const stores = await models.Store.findAll({ attributes: ['id'] });
      storeIds = stores.map(s => s.id);
    }

    // Step 2: Build filter
    const whereClause = { storeId: storeIds };
    if (typeof isRejected === 'boolean') {
      whereClause.isRejected = isRejected;
    }

    // Step 3: Fetch storeItems and UOMs
    const [storeItems, uomData] = await Promise.all([
      models.StoreItems.findAll({ where: whereClause }),
      models.UOM.findAll()
    ]);

    if (storeItems.length === 0) {
      const emptyResponse = storeIds.map(id => ({ storeId: id, storeItems: [] }));
      return res.status(200).json({ data: emptyResponse });
    }

    // Step 4: Prepare maps
    const uomMap = new Map(uomData.map(u => [u.id, u.code]));

    // Aggregate quantities and prepare unique itemIds for batch queries
    const aggregated = {};
    const itemIdsSet = new Set();

    for (const si of storeItems) {
      const key = `${si.storeId}_${si.itemId}_${si.isRejected}`;
      if (!aggregated[key]) {
        aggregated[key] = {
          storeId: si.storeId,
          itemId: si.itemId,
          isRejected: si.isRejected,
          quantity: 0
        };
      }
      aggregated[key].quantity += si.quantity;
      itemIdsSet.add(si.itemId);
    }

    // Step 5: Batch fetch Items and AlternateUnits
    const [items, alternateUnits] = await Promise.all([
      models.Items.findAll({ where: { id: Array.from(itemIdsSet) } }),
      models.AlternateUnits.findAll({ where: { itemId: Array.from(itemIdsSet) } })
    ]);

    // Map items and their alternate units
    const itemMap = new Map();
    for (const item of items) {
      itemMap.set(item.id, item.toJSON());
    }

    const altUnitMap = new Map();
    for (const alt of alternateUnits) {
      if (!altUnitMap.has(alt.itemId)) altUnitMap.set(alt.itemId, []);
      altUnitMap.get(alt.itemId).push({
        ...alt.dataValues,
        code: uomMap.get(alt.alternateUnits) || null
      });
    }

    // Step 6: Build final result by storeId
    const resultByStore = {};
    for (const entry of Object.values(aggregated)) {
      const { storeId, itemId, quantity, isRejected } = entry;
      if (!resultByStore[storeId]) resultByStore[storeId] = [];

      const item = itemMap.get(itemId) || { id: itemId, message: 'Item not found' };
      item.alternateUnit = altUnitMap.get(itemId) || [];

      resultByStore[storeId].push({ item, quantity, isRejected });
    }

    // Step 7: Return data per store
    const response = storeIds.map(id => ({
      storeId: id,
      storeItems: resultByStore[id] || []
    }));

    return res.status(200).json({ data: response });
  } catch (error) {
    console.error('Error in getAllStoreItemsByStoresID:', error);
    return res.status(500).json({ message: 'Something went wrong.', error: error.message });
  }
}

async function getAllStoresWithItems(req, res) {
  const { storeIds, isRejected = false } = req.body;
  if (!storeIds?.length) return res.status(404).json({ message: "Store Not found." });

  try {
    const storeItemsData = [];
    for (const storeId of storeIds) {
      // Fetch StoreItems and UOMs
      const [storeItemsRaw, uomData] = await Promise.all([
        models.StoreItems.findAll({
          where: { storeId, isRejected },
          raw: true
        }),
        models.UOM.findAll({ raw: true })
      ]);

      // Map UOM IDs to codes
      const uomMap = uomData.reduce((map, uom) => {
        map[uom.id] = uom.code;
        return map;
      }, {});

      const itemQuantityMap = {};
      const itemPriceMap = {};
      const uniqueStoreItems = {};

      for (const item of storeItemsRaw) {
        const itemId = item.itemId;
        const quantity = item.quantity;
        const price = item.price;

        // Aggregate quantity and price
        itemQuantityMap[itemId] = (itemQuantityMap[itemId] || 0) + quantity;
        if (quantity > 0) {
          itemPriceMap[itemId] = (itemPriceMap[itemId] || 0) + (price * quantity);
        }

        // Store one instance of each item
        if (!uniqueStoreItems[itemId]) {
          uniqueStoreItems[itemId] = item;
        }
      }

      const itemIds = Object.keys(uniqueStoreItems);

      // Fetch item data and alternate units in bulk
      const [itemsData, alternateUnitsData] = await Promise.all([
        models.Items.findAll({
          where: { id: itemIds },
          raw: true
        }),
        models.AlternateUnits.findAll({
          where: { itemId: itemIds },
          raw: true
        })
      ]);

      // Map alternate units by itemId
      const alternateUnitsMap = alternateUnitsData.reduce((acc, unit) => {
        const itemId = unit.itemId;
        const unitWithCode = { ...unit, code: uomMap[unit.alternateUnits] || null };
        acc[itemId] = acc[itemId] || [];
        acc[itemId].push(unitWithCode);
        return acc;
      }, {});

      // Build final store items
      const storeItems = itemIds.map(itemId => {
        const baseItem = uniqueStoreItems[itemId];
        return {
          ...baseItem,
          quantity: itemQuantityMap[itemId],
          averagePrice: itemPriceMap[itemId] || 0,
          itemId: {
            ...itemsData.find(item => item.id === Number(itemId)),
            alternateUnit: alternateUnitsMap[itemId] || []
          }
        };
      });
      storeItemsData.push(storeItems);
    }
    return res.status(200).json({ storeItemsData });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong." });
  }
}

async function getCompanyStoreTotals(req, res) {
  const { companyId } = req.body;
  if (!companyId) {
    return res
      .status(400)
      .json({ message: "companyId parameter is required." });
  }

  try {
    const stores = await models.Store.findAll({
      where: { companyId },
      attributes: ["id", "name"],
      raw: true,
    });

    if (stores.length === 0) {
      return res
        .status(404)
        .json({ message: "No stores found for this company." });
    }

    const storeIds = stores.map((s) => s.id);
    const totals = await models.StoreItems.findAll({
      where: {
        storeId: { [Op.in]: storeIds },
        quantity: { [Op.gt]: 0 },
      },
      attributes: [
        "storeId",
        "isRejected",
        [
          Sequelize.fn("SUM", Sequelize.literal("price * quantity")),
          "totalPrice",
        ],
      ],
      group: ["storeId", "isRejected"],
      raw: true,
    });

    const totalMap = {};
    totals.forEach((row) => {
      const sid = row.storeId;
      totalMap[sid] = totalMap[sid] || { inStockTotal: 0, rejectedTotal: 0 };
      if (row.isRejected) {
        totalMap[sid].rejectedTotal = parseFloat(row.totalPrice);
      } else {
        totalMap[sid].inStockTotal = parseFloat(row.totalPrice);
      }
    });

    const response = stores.map((store) => ({
      storeId: store.id,
      storeName: store.name,
      inStockTotal: totalMap[store.id]?.inStockTotal || 0,
      rejectedTotal: totalMap[store.id]?.rejectedTotal || 0,
    }));

    return res.status(200).json({ data: response });
  } catch (err) {
    console.error("Error in getCompanyStoreTotals:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
}

async function getAllRejectStoreItems(req, res) {
  const { companyId } = req.body;
  if (!companyId) {
    return res
      .status(400)
      .json({ message: "companyId parameter is required." });
  }

  try {
    const stores = await models.Store.findAll({
      where: { companyId },
      attributes: ["id", "name"],
      raw: true,
    });

    const storeIds = stores.map((s) => s.id);
    const StoresMap = stores?.reduce((acc, curr) => {
      acc[curr.id] = curr.name;
      return acc;
    }, {});
    const StoreItems = await models.StoreItems.findAll({
      where: {
        storeId: { [Op.in]: storeIds },
        isRejected: true,
        quantity: { [Op.gt]: 0 },
      },
      raw: true,
    });

    const items = await models.Items.findAll({
      where: {
        companyId: Number(companyId)
      },
      raw: true
    });
    const ItemsMap = items?.reduce((acc, curr) => {
      acc[curr.id] = curr.itemId;
      return acc;
    }, {});
    const storeMap = {};
    for (const storeItem of StoreItems) {
      if (!storeMap[StoresMap[storeItem.storeId]]) storeMap[StoresMap[storeItem.storeId]] = {};
      storeMap[StoresMap[storeItem.storeId]][ItemsMap[storeItem.itemId]] = (storeMap[StoresMap[storeItem.storeId]][ItemsMap[storeItem.itemId]] || 0) + storeItem.quantity;
    }
    return res.status(200).json({ data: storeMap });
  } catch (err) {
    console.error("Error in getCompanyStoreTotals:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
}

async function getFifoPrice(req, res) {
  try {
    const { rows } = req.body;
    const items = await models.Items.findAll({
      where: {
        id: {
          [Op.in]: rows.map(row => row.item)
        }
      },
      attributes: ['id', 'itemId'],
      raw: true
    });
    const itemsMap = items.reduce((acc, curr) => {
      acc[curr.id] = curr.itemId;
      return acc;
    }, {});
    const obj = {};
    for (const element of rows) {
      const storeItems = await models.StoreItems.findAll({
        where: {
          quantity: {
            [Op.gt]: 0
          },
          itemId: element.item,
          storeId: Number(element.fromStore),
          isRejected: element.isRejected
        },
        raw: true
      });
      let fifoPrice = 0, quantity = element.quantity;
      for (const store of storeItems) {
        if (quantity <= 0) break;
        const deductQty = Math.min(quantity, store.quantity);
        quantity -= deductQty;
        const currentAverarge = (deductQty * store.price);
        fifoPrice += currentAverarge;
      }
      obj[itemsMap[element.item]] = fifoPrice / element.quantity;
    }
    res.status(200).json({
      data: obj
    });
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Internal server error." });
  }
}

async function setDefaultStore(req, res) {
  const transaction = await models.sequelize.transaction();

  try {
    const { companyId, storeId } = req.body;

    // 1️⃣ Remove default from all stores of the company
    await models.Store.update(
      { default: false },
      {
        where: { companyId },
        transaction
      }
    );

    // 2️⃣ Set selected store as default
    const [updatedCount] = await models.Store.update(
      { default: true },
      {
        where: {
          id: storeId,
          companyId
        },
        transaction
      }
    );

    if (updatedCount === 0) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Store not found for this company"
      });
    }

    // 3️⃣ Commit transaction
    await transaction.commit();

    return res.status(200).json({
      message: "Default store updated successfully"
    });

  } catch (error) {
    console.log(error)
    await transaction.rollback();
    return res.status(500).json({
      message: "Something went wrong while setting default store",
      error
    });
  }
}


module.exports = {
  addStore: addStore,
  getStoresById: getStoresById,
  getStores: getStores,
  editStore: editStore,
  deleteStore: deleteStore,
  getStoresByItem: getStoresByItem,
  stockTransfer: stockTransfer,
  getItemStockTransferHistory: getItemStockTransferHistory,
  getStockTransferHistory: getStockTransferHistory,
  getStoreItemsByStoreId: getStoreItemsByStoreId,
  getAllStoreItemsByStoresID: getAllStoreItemsByStoresID,
  getAllStoresWithItems: getAllStoresWithItems,
  getCompanyStoreTotals: getCompanyStoreTotals,
  getAllRejectStoreItems,
  getFifoPrice,
  setDefaultStore
};
