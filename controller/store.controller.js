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


function deleteStore(req, res) {
  const storeId = req.body.storeId; // Assuming the store ID is passed as a URL parameter

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
          },
        });

        // Add store data along with item count to the response
        storesWithItemCount.push({
          ...store.toJSON(), // Spread the store object to include all columns
          itemCount: itemCount, // This is the number of items in the store
        });
      } catch (err) {
        // Log and continue if there's an error counting items for a particular store
        console.error(`Error counting items for store ${store.id}:`, err);
        storesWithItemCount.push({
          ...store.toJSON(),
          itemCount: 0, // Default to 0 if there's an issue counting items
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
      where: { itemId },
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



function stockTransfer(req, res) {
  const { transferNumber, stockData, transferDate, transferredBy, companyId, addReduce } = req.body;
  let storeItemResults = [];
  // Use Promise.all to handle asynchronous create calls for StockTransfer entries
  Promise.all(
    stockData.map(element =>
      models.StockTransfer.create({
        transferNumber: transferNumber,
        fromStoreId: element.fromStore,
        itemId: element.itemId,
        quantity: addReduce == 2 ? element.quantity * -1 : element.quantity,
        toStoreId: element.toStore,
        transferDate: transferDate,
        transferredBy: transferredBy,
        comment: stockData.comment,
        companyId: companyId
      })
    )
  )
    .then(results => {
      // After StockTransfer entries are created, insert data into StoreItems
      return Promise.all(
        stockData.flatMap(element => [
          // Insert into StoreItems for the `fromStore` (reducing quantity)
          models.StoreItems.create({
            storeId: element.fromStore,
            itemId: element.itemId,
            quantity: -element.quantity, // Deduct quantity from the source store
            status: 1, // Assuming 1 is the status for successful transfer
            addedBy: transferredBy, // Replace with actual user ID from request context
          }),
          // Insert into StoreItems for the `toStore` (adding quantity)
          models.StoreItems.create({
            storeId: element.toStore,
            itemId: element.itemId,
            quantity: addReduce == 2 ? -element.quantity : element.quantity, // Add quantity to the destination store
            status: 1,
            addedBy: transferredBy,
          }),
        ])
      );
    })
    .then((storeItemResult) => {
      storeItemResults = storeItemResult;
      return Promise.all(
        stockData.map(data =>
          models.Items.update(
            { currentStock: addReduce == 2 ? -data.quantity : data.quantity },
            { where: { itemId: data.itemId } }
          )
        )
      );
    })
    .then(() => {
      res.status(201).json({
        message: "Stock transfer entries and store items updated successfully",
        stockTransfers: storeItemResults,
      });
    })
    .catch(error => {
      res.status(500).json({
        message: "Something went wrong, please try again later!",
        error: error,
      });
    });
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
      where: { itemId },
      attributes: [
        'createdAt',
        'transferNumber',
        'quantity',
        'itemId',
        'fromStoreId',
        'toStoreId',
        'transferredBy',
        'comment'
      ],
      order: [['createdAt', 'ASC']], // Order by date for cumulative calculations
      raw: true,  // Ensures data is returned as plain objects
    });

    console.log(stockTransfers);

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
      storeQuantities[transfer.fromStoreId] -= transfer.quantity;
      const fromStoreCurrentQuantity = storeQuantities[transfer.fromStoreId];

      // Previous and current quantities for `toStore`
      const toStorePreviousQuantity = storeQuantities[transfer.toStoreId];
      storeQuantities[transfer.toStoreId] += transfer.quantity;
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
        comment: transfer.comment
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




module.exports = {
  addStore: addStore,
  getStoresById: getStoresById,
  getStores: getStores,
  editStore: editStore,
  deleteStore: deleteStore,
  getStoresByItem: getStoresByItem,
  stockTransfer: stockTransfer,
  getItemStockTransferHistory: getItemStockTransferHistory,
  getStockTransferHistory: getStockTransferHistory
};
