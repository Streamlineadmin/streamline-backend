const models = require("../models");

function addDocumentItems(req, res) {
  console.log("Request received:", req.body);
  // Check if items already exists for the given company
  models.DocumentItems.findOne({
    where: {
      documentNumber: req.body.documentNumber,
      itemId: req.body.itemId,
      // itemName: req.body.itemName,
      // HSN: req.body.HSN,
      // UOM: req.body.UOM,
      // quantity: req.body.quantity,
      // price: req.body.price,
      // discountOne: req.body.discountOne,
      // discountTwo: req.body.discountTwo,
      // totalDiscount: req.body.totalDiscount,
      // taxType: req.body.taxType,
      // tax: req.body.tax,
      // totalTax: req.body.totalTax,
      // totalBeforeTax: req.body.totalBeforeTax,
      // totalAfterTax: req.body.totalAfterTax,
    },
  })
    .then((existingItem) => {
      if (existingItem) {
        return res.status(409).json({
          message: "item already exists!",
        });
      } else {
        // Account number does not exist, proceed to create
        const newItem = {
          documentNumber: req.body.documentNumber,
          itemId: req.body.itemId,
          itemName: req.body.itemName,
          HSN: req.body.HSN,
          UOM: req.body.UOM,
          quantity: req.body.quantity,
          price: req.body.price,
          discountOne: req.body.discountOne,
          discountTwo: req.body.discountTwo,
          totalDiscount: req.body.totalDiscount,
          taxType: req.body.taxType,
          tax: req.body.tax,
          totalTax: req.body.totalTax,
          totalBeforeTax: req.body.totalBeforeTax,
          totalAfterTax: req.body.totalAfterTax,
          ip_address: req.body.ip_address,
          status: 1,
        };

        models.DocumentItems.create(items)
          .then((result) => {
            res.status(201).json({
              message: "Items details added successfully",
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
    })
    .catch((error) => {
      res.status(500).json({
        message: "Something went wrong, please try again later!",
        error: error,
      });
    });
}

function editDocumentItems(req, res) {
  const itemId = req.body.itemId;
  // const documentNumber = req.body.documentNumber;
  // const companyId = req.body.companyId;
  const updatedItemData = {
    documentNumber: req.body.documentNumber,
    itemId: req.body.itemId,
    itemName: req.body.itemName,
    HSN: req.body.HSN,
    UOM: req.body.UOM,
    quantity: req.body.quantity,
    price: req.body.price,
    discountOne: req.body.discountOne,
    discountTwo: req.body.discountTwo,
    totalDiscount: req.body.totalDiscount,
    taxType: req.body.taxType,
    tax: req.body.tax,
    totalTax: req.body.totalTax,
    totalBeforeTax: req.body.totalBeforeTax,
    totalAfterTax: req.body.totalAfterTax,
    ip_address: req.body.ip_address,
    status: req.body.status || 1,
  };

  models.DocumentItems.findOne({
    where: {
      documentNumber: req.body.documentNumber,
      itemId: req.body.itemId,
      id: { [models.Sequelize.Op.ne]: req.body.id },
      // itemName: req.body.itemName,
      // HSN: req.body.HSN,
      // UOM: req.body.UOM,
      // quantity: req.body.quantity,
      // price: req.body.price,
      // discountOne: req.body.discountOne,
      // discountTwo: req.body.discountTwo,
      // totalDiscount: req.body.totalDiscount,
      // taxType: req.body.taxType,
      // tax: req.body.tax,
      // totalTax: req.body.totalTax,
      // totalBeforeTax: req.body.totalBeforeTax,
      // totalAfterTax: req.body.totalAfterTax,
    },
  })
    .then((existingItemsDetails) => {
      if (existingItemsDetails) {
        // If a account number with the same number already exists for the company
        return res.status(409).json({
          message: "Items already exists",
        });
      } else {
        // Proceed with the update
        models.DocumentItems.update(updatedItemData, {
          where: { id: req.body.id },
        })
          .then((result) => {
            if (result[0] > 0) {
              res.status(200).json({
                message: "Items updated successfully",
                post: updatedItemData,
              });
            } else {
              res.status(404).json({
                message: "Items not found",
              });
            }
          })
          .catch((error) => {
            res.status(500).json({
              message: "Something went wrong, please try again later!",
              error: error.message || error,
            });
          });
      }
    })
    .catch((error) => {
      res.status(500).json({
        message: "Something went wrong, please try again later!",
        error: error.message || error,
      });
    });
}

function deleteDocumentItems(req, res) {
  const id = req.body.id; 

  models.DocumentItems.destroy({ where: { id: id } })
    .then((result) => {
      if (result) {
        res.status(200).json({
          message: "Item deleted successfully",
        });
      } else {
        res.status(200).json({
          message: "Item not found",
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

function getDocumentItems(req, res) {
  models.DocumentItems.findAll({
    where: {
      itemId: req.body.itemId,
    },
  })
    .then((result) => {
      if (!result || result.length === 0) {
        return res.status(200).json([]);
      }
      res.status(200).json(result);
    })
    .catch((error) => {
      console.error("Error fetching items", error);
      res.status(500).json({
        message: "Something went wrong, please try again later!",
      });
    });
}

module.exports = {
  addDocumentItems: addDocumentItems,
  getDocumentItems: getDocumentItems,
  editDocumentItems: editDocumentItems,
  deleteDocumentItems: deleteDocumentItems,
};
