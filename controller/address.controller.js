const models = require("../models");

function addAddress(req, res) {
  const { addressType, companyId, ip_address, addressLineOne, addressLineTwo, pinCode, city, state, country } = req.body;

  // Define the common data for both addresses
  const baseAddress = {
    companyId,
    ip_address,
    addressLineOne,
    addressLineTwo,
    pincode: pinCode,
    city,
    state,
    country,
    status: 1,
  };

  // Prepare an array for storing the promises of address creation
  const addressPromises = [];

  // Check for addressType and insert accordingly
  if (addressType.includes(1)) {
    // Create delivery address
    const deliveryAddress = { ...baseAddress, addressType: 1 }; // Delivery Address
    addressPromises.push(models.Addresses.create(deliveryAddress));
  }

  if (addressType.includes(2)) {
    // Create billing address
    const billingAddress = { ...baseAddress, addressType: 2 }; // Billing Address
    addressPromises.push(models.Addresses.create(billingAddress));
  }

  // Execute all the insertions
  Promise.all(addressPromises)
    .then((results) => {
      res.status(201).json({
        message: "Address(es) added successfully",
        posts: results,
      });
    })
    .catch((error) => {
      res.status(500).json({
        message: "Something went wrong, please try again later!",
        error: error.message || error,
      });
    });
}


function editAddress(req, res) {
  const addressId = req.body.addressId;

  // updatedAddressData
  const updatedStoreData = {
    companyId: req.body.companyId,
    ip_address: req.body.ip_address,
    addressLineOne: req.body.addressLineOne,
    addressLineTwo: req.body.addressLineTwo,
    pincode: req.body.pinCode,
    city: req.body.city,
    state: req.body.state,
    country: req.body.country,
    addressType: req.body.addressType,
    status: req.body.status || 1,
  };

  models.Addresses.update(updatedStoreData, { where: { id: addressId } })
    .then((result) => {
      if (result[0] > 0) {
        res.status(200).json({
          message: "Address updated successfully",
          post: updatedStoreData,
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

function deleteAddress(req, res) {
  const storeId = req.body.storeId; // Assuming the store ID is passed as a URL parameter

  models.Addresses.destroy({ where: { id: storeId } })
    .then((result) => {
      if (result) {
        res.status(200).json({
          message: "Address deleted successfully",
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

function getAddressById(req, res) {
  const id = req.params.id;

  models.Addresses.findByPk(id)
    .then((result) => {
      res.status(200).json(result);
    })
    .catch((error) => {
      res.status(500).json({
        message: "something went wrong, please try again later!",
      });
    });
}

function getAddresses(req, res) {
  models.Addresses.findAll({
    where: {
      companyId: req.body.companyId,
    },
  })
    .then((result) => {
      if (!result || result.length === 0) {
        return res.status(200).json([]);
      }
      res.status(200).json(result);
    })
    .catch((error) => {
      console.error("Error fetching stores:", error);
      res.status(500).json({
        message: "Something went wrong, please try again later! its wrong",
      });
    });
}

async function setDefaultAddress(req, res) {
  const { companyId, addressId } = req.body;

  try {
    // Find the address using addressId and companyId
    const address = await models.Addresses.findOne({
      where: { id: addressId, companyId }
    });

    // If the address doesn't exist, return an error
    if (!address) {
      return res.status(404).json({ message: "Address not found!" });
    }

    const { addressType } = address; // Extract the addressType (1 for delivery, 2 for billing)

    // Start a transaction to ensure atomicity (optional but recommended)
    const transaction = await models.sequelize.transaction();

    try {
      // Set all addresses of the same type and company as normal (status: 1)
      await models.Addresses.update(
        { status: 1 }, // Non-default (normal)
        { 
          where: { companyId, addressType, status: 0 }, // Update only default addresses of this type
          transaction
        }
      );

      // Set the selected address as default (status: 0)
      await models.Addresses.update(
        { status: 0 }, // Default
        { where: { id: addressId }, transaction }
      );

      // Commit the transaction
      await transaction.commit();

      // Success response
      res.status(200).json({
        message: `Address with ID ${addressId} has been set as default for ${addressType === 1 ? 'Delivery' : 'Billing'}.`
      });

    } catch (error) {
      // If something goes wrong, roll back the transaction
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    // Catch any errors and send a failure response
    res.status(500).json({
      message: "Something went wrong while setting the default address.",
      error: error.message || error
    });
  }
}


module.exports = {
  addAddress: addAddress,
  getAddressById: getAddressById,
  getAddresses: getAddresses,
  editAddress: editAddress,
  deleteAddress: deleteAddress,
  setDefaultAddress: setDefaultAddress
};
