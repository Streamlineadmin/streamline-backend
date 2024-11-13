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
    const stores = await Store.findAll({
      where: {
        companyId: companyId,
      },
    });

    // Check if no stores were found
    if (stores.length === 0) {
      return res.status(404).json({
        message: `No stores found for companyId ${companyId}`,
      });
    }

    // Step 3: Count items in each store
    const storesWithItemCount = [];

    for (const store of stores) {
      try {
        // Count the number of items in the StoreItems table for each store
        const itemCount = await StoreItem.count({
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



module.exports = {
  addStore: addStore,
  getStoresById: getStoresById,
  getStores: getStores,
  editStore: editStore,
  deleteStore: deleteStore,
};
