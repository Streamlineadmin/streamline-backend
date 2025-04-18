const models = require("../models");

function addStore(req, res) {
  // Check if team name already exists for the given company
  models.Store.findOne({ where: { name: req.body.storeName, companyId: req.body.companyId } }).then(storeResult => {
    if (storeResult) {
      return res.status(409).json({
        message: "Store name already exists!",
      });
    } else {
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
      };

      models.Store.create(store)
        .then((result) => {
          res.status(201).json({
            message: "Store added successfully",
            post: result,
          });
        })
        .catch((error) => {
          res.status(500).json({
            message: "Something went wrong, please try again later!",
            error: error,
          });
        });
    }
  }).catch(error => {
    res.status(500).json({
      message: "Something went wrong, please try again later!",
      error: error
    });
  });
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
  const id = req.params.id;

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

  // Step 1: Check if companyId is provided
  if (!companyId) {
    return res.status(400).json({
      message: 'companyId is required in the request body',
    });
  }

  try {
    // Step 2: Retrieve all stores for the company (without limiting columns)
    const stores = await models.Store.findAll({
      where: { companyId: companyId },
    });

    // Check if no stores were found
    if (!stores || stores.length === 0) {
      return res.status(200).json([]);
    }

    // Step 3: Count items in each store
    const storesWithItemCount = [];

    for (const store of stores) {
      try {
        // Count the number of items in the StoreItems table for each store
        const itemCount = await models.StoreItems.count({
          where: {
            storeId: store.id,
            isRejected: false
          },
          distinct: true,
          col: 'itemId'
        });
        const rejectedItemCount = await models.StoreItems.count({
          where: {
            storeId: store.id,
            isRejected: true
          },
          distinct: true,
          col: 'itemId'
        });

        // Add store data along with item count to the response
        storesWithItemCount.push({
          ...store.toJSON(), // Spread the store object to include all columns
          itemCount: itemCount, // This is the number of items in the store
          rejectedItemCount
        });
      } catch (err) {
        // Log and continue if there's an error counting items for a particular store
        console.error(`Error counting items for store ${store.id}:`, err);
        storesWithItemCount.push({
          ...store.toJSON(),
          itemCount: 0, // Default to 0 if there's an issue counting items
          rejectedItemCount: 0
        });
      }
    }

    res.status(200).json(storesWithItemCount);
  } catch (error) {
    // Catch and log any errors that happen during the process
    console.error('Error fetching stores:', error);
    res.status(500).json({
      message: 'Something went wrong, please try again later!',
      error: error.message, // Include the error message for debugging
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
      where: { itemId, isRejected: false },
      attributes: ['storeId', 'quantity'], // Only retrieve storeId and quantity
    });

    // Check if any store was found for the given itemId
    if (storeItems.length === 0) {
      return res.status(200).json([]);
    }

    // Aggregate the quantities for each storeId
    const storeQuantities = storeItems.reduce((acc, { storeId, quantity }) => {
      acc[storeId] = (acc[storeId] || 0) + quantity;
      return acc;
    }, {});

    // Step 3: Filter out stores with a total negative quantity
    const validStoreIds = Object.entries(storeQuantities)
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
      where: { id: validStoreIds },
      attributes: ['id', 'name'], // Specify the columns you want from Store
    });

    // Step 5: Combine the store data with the total quantities
    const storesWithItemDetails = stores.map(store => ({
      storeId: store.id,
      storeName: store.name,
      quantity: storeQuantities[store.id], // Use aggregated quantity
    }));

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
  const { transferNumber, stockData, transferDate, transferredBy, companyId, useFIFO, addReduce } = req.body;

  try {
    // Iterate through each stock transfer item
    for (const element of stockData) {
      let price = 0;
      let remainingQuantity = element.quantity;
      const item = await models.Items.findOne({
        where: {
          id: element.itemId
        }
      });
      if (useFIFO && addReduce == 2) {
        // Fetch existing stock based on FIFO (oldest stock first)
        const existingStock = await models.StoreItems.findAll({
          where: { storeId: element.toStore, itemId: element.itemId, isRejected: false },
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
          await models.StockTransfer.create({
            transferNumber,
            fromStoreId: element?.fromStore || null,
            itemId: element.itemId,
            quantity: -deductQty,
            toStoreId: element.toStore,
            transferDate,
            transferredBy,
            comment: stockData.comment,
            companyId,
            price: stock.price
          });
          price += (stock.price * deductQty);
        }
      } else {
        // Direct deduction if FIFO is not enabled
        (element.fromStore || addReduce == 2) && await models.StoreItems.create({
          storeId: element.fromStore || element.toStore,
          itemId: element.itemId,
          quantity: element.quantity * -1,
          status: 1,
          addedBy: transferredBy,
          price: item?.price
        });
      }

      // Create StockTransfer entry
      await models.StockTransfer.create({
        transferNumber,
        fromStoreId: element?.fromStore || null,
        itemId: element.itemId,
        quantity: addReduce == 2 ? -element.quantity : element.quantity,
        toStoreId: element.toStore,
        transferDate,
        transferredBy,
        comment: stockData.comment,
        companyId,
        price: element.price
      });

      // Add quantity to destination store
      addReduce != 2 && await models.StoreItems.create({
        storeId: element.toStore,
        itemId: element.itemId,
        quantity: element.quantity,
        status: 1,
        addedBy: transferredBy,
        price: element?.price
      });

      if (!element.fromStore) {
        await models.Items.update(
          {
            currentStock: item.currentStock + (addReduce != 2 ? element.quantity : element.quantity * -1),
            price: addReduce == 2 ? useFIFO ? ((item.price * item.currentStock) - price) / (item.currentStock - element.quantity) : item.price : (((item.currentStock * item.price) + (element.quantity * element.price)) / (item.currentStock + element.quantity))
          },
          { where: { id: element.itemId, companyId } }
        );
      }
    }

    res.status(201).json({
      message: "Stock transfer completed successfully with FIFO handling",
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
  const { itemId } = req.body; // Extract itemId from the payload

  if (!itemId) {
    return res.status(400).json({
      message: "itemId is required",
    });
  }

  try {
    // Fetch stock transfers for the given itemId
    const stockTransfers = await models.StockTransfer.findAll({
      where: { itemId, isRejected: req.body.isRejected || false },
      attributes: [
        'createdAt',
        'transferNumber',
        'quantity',
        'itemId',
        'fromStoreId',
        'toStoreId',
        'transferredBy',
        'comment',
        'price',
        'documentNumber',
        'documentType'
      ],
      order: [['createdAt', 'ASC']], // Order by date for cumulative calculations
      raw: true,  // Ensures data is returned as plain objects
    });

    if (!stockTransfers.length) {
      return res.status(200).json({
        message: `No stock transfers found for itemId ${itemId}`,
        data: [],
      });
    }

    // Fetch the item name from the Items table
    const item = await models.Items.findOne({
      where: { id: itemId },
      attributes: ['itemName', 'itemId'],
    });

    if (!item) {
      console.log(`No item found with itemId ${itemId}`); // Debugging the missing item
      return res.status(404).json({
        message: `No item found with itemId ${itemId}`,
      });
    }

    // Fetch unique store IDs from stockTransfers (both from and to store)
    const storeIds = [
      ...new Set(
        stockTransfers.flatMap(transfer => [transfer.fromStoreId, transfer.toStoreId])
      ),
    ];

    // Fetch store names for the collected store IDs
    const stores = await models.Store.findAll({
      where: { id: storeIds },
      attributes: ['id', 'name'],
    });

    // Map store IDs to store names
    const storeMap = stores.reduce((map, store) => {
      map[store.id] = store.name;
      return map;
    }, {});

    // Fetch unique transferredBy user IDs
    const userIds = [...new Set(stockTransfers.map(transfer => transfer.transferredBy))];

    // Fetch user names for the collected user IDs
    const users = await models.Users.findAll({
      where: { id: userIds },
      attributes: ['id', 'name'],
    });

    // Map user IDs to user names
    const userMap = users.reduce((map, user) => {
      map[user.id] = user.name;
      return map;
    }, {});

    // Initialize cumulative quantities for stores
    const storeQuantities = {};

    const enrichedTransfers = stockTransfers.map(transfer => {
      // Initialize cumulative quantities for `fromStore` and `toStore` if not set
      if (!storeQuantities[transfer.fromStoreId]) {
        storeQuantities[transfer.fromStoreId] = 0;
      }
      if (!storeQuantities[transfer.toStoreId]) {
        storeQuantities[transfer.toStoreId] = 0;
      }

      // Previous and current quantities for `fromStore`
      const fromStorePreviousQuantity = storeQuantities[transfer.fromStoreId];
      storeQuantities[transfer.fromStoreId] = transfer.quantity < 0 ? (storeQuantities[transfer.fromStoreId] + transfer.quantity) : (storeQuantities[transfer.fromStoreId] - transfer.quantity);
      const fromStoreCurrentQuantity = storeQuantities[transfer.fromStoreId];

      // Previous and current quantities for `toStore`
      const toStorePreviousQuantity = storeQuantities[transfer.toStoreId];
      storeQuantities[transfer.toStoreId] = transfer.quantity > 0 ? (storeQuantities[transfer.toStoreId] + transfer.quantity) : (storeQuantities[transfer.toStoreId] - transfer.quantity);
      const toStoreCurrentQuantity = storeQuantities[transfer.toStoreId];

      // Enrich the transfer record
      return {
        createdAt: transfer.createdAt,
        transferNumber: transfer.transferNumber,
        quantity: transfer.quantity,
        itemName: item.itemName,  // Enrich with item name
        itemId: item.itemId,
        fromStore: {
          name: storeMap[transfer.fromStoreId] || 'Unknown Store',
          previousQuantity: fromStorePreviousQuantity,
          currentQuantity: fromStoreCurrentQuantity,
        },
        toStore: {
          name: storeMap[transfer.toStoreId] || 'Unknown Store',
          previousQuantity: toStorePreviousQuantity,
          currentQuantity: toStoreCurrentQuantity,
        },
        transferredBy: userMap[transfer.transferredBy] || 'Unknown User',  // Enrich with user name
        comment: transfer.comment,
        price: transfer.price,
        documentNumber: transfer.documentNumber || '',
        documentType: transfer.documentType || ''
      };
    });

    res.status(200).json({
      message: "Stock transfers fetched successfully",
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
  const { storeId } = req.body;
  if (!storeId) return res.status(404).json({ message: "Store Not found." });
  try {
    let [storeItems, uomData] = await Promise.all([models.StoreItems.findAll({
      where: {
        storeId,
        isRejected: req.body.isRejected || false
      }
    }), models.UOM.findAll({})]);
    const myMap = new Map();
    uomData.map((uom => myMap.set(uom.id, uom.code)));
    const stores = {};
    let arr = [];
    for (const storeItem of storeItems) {
      if (stores[storeItem?.itemId] || stores[storeItem?.itemId] == 0) {
        stores[storeItem.itemId] += storeItem?.quantity;
      }
      else {
        stores[storeItem.itemId] = storeItem?.quantity;
        arr.push(storeItem);
      }
    }
    storeItems = [];
    for (const storeItem of arr) {
      storeItem.quantity = stores[storeItem.itemId];
      const item = await models.Items.findOne({
        where: {
          id: storeItem.itemId
        }
      });
      if (item) {
        const alternateUnit = await models.AlternateUnits.findAll({
          where: {
            itemId: item.id
          }
        });
        const units = [];
        for (const unit of alternateUnit) {
          let obj = { ...unit?.dataValues };
          const code = myMap.get(unit.alternateUnits);
          obj.code = code;
          units.push(obj);
        }
        item.alternateUnit = units;
        storeItem.itemId = item;
        storeItems.push(storeItem);
      }
    }
    res.status(200).json({ storeItems });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went Wrong." });
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
  getStoreItemsByStoreId: getStoreItemsByStoreId
};
