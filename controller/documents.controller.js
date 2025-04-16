const { Op } = require('sequelize');
const models = require('../models');
const { documentTypes } = require('../helpers/document-type');

async function createDocument(req, res) {
  try {
    const {
      documentType = null,
      documentNumber = null,
      documentTo = null,
      buyerName = null,
      buyerBillingAddress = null,
      advancePayment = null,
      buyerDeliveryAddress = null,
      buyerContactNumber = null,
      buyerEmail = null,
      supplierName = null,
      supplierBillingAddress = null,
      supplierDeliverAddress = null,
      supplierContactNo = null,
      supplierEmail = null,
      documentDate = null,
      ammendment = null,
      deliveryDate = null,
      paymentTerm = null,
      store = null,
      enquiryNumber = null,
      enquiryDate = null,
      logisticDetailsId = null,
      additionalDetails = null,
      signature = null,
      companyId = null,
      createdBy = null,
      status = null,
      ip_address = null,
      paymentDate = null,
      POCName = null,
      POCNumber = null,
      POCDate = null,
      OCNumber = null,
      OCDate = null,
      transporterName = null,
      TGNumber = null,
      TDNumber = null,
      TDDate = null,
      VehicleNumber = null,
      replyDate = null,
      Attention = null,
      invoiceNumber = null,
      invoiceDate = null,
      billDate = null,
      returnRecieveDate = null,
      creditNoteNumber = null,
      creditNotedate = null,
      items = [],
      additionalCharges = [],
      bankDetails = {},
      termsCondition = null,
      quotationNumber = null,
      quotationDate = null,
      orderConfirmationNumber = null,
      orderConfirmationDate = null,
      purchaseOrderNumber = null,
      purchaseOrderDate = null,
      grn_number = null,
      grn_Date = null,
      indent_number = null,
      indent_date = null,
      supplier_invoice_number = null,
      supplier_invoice_date = null,
      challan_number = null,
      challan_date = null,
      debit_note_number = null,
      performaInvoiceNumber = null,
      performaInvoiceDate = null,
      debit_note_date = null,
      pay_to_transporter = null,
      inspection_date = null,
      attachments = [],
      documentComments = null,
      tcsData = [],
      BuyerPANNumber = null,
      isRounded = null,
      reduceStockOnDC = '',
      reduceStockOnIV = '',
      GSTValue = null,
      buyerGSTNumber = null,
      is_refered = null,
    } = req.body;

    const document = await models.Documents.create({
      documentType,
      documentNumber,
      buyerName,
      documentTo,
      buyerBillingAddress,
      advancePayment,
      GSTValue,
      buyerGSTNumber,
      is_refered,
      buyerDeliveryAddress,
      buyerContactNumber,
      buyerEmail,
      supplierName,
      supplierBillingAddress,
      supplierDeliverAddress,
      supplierContactNo,
      supplierEmail,
      documentDate,
      ammendment,
      deliveryDate,
      paymentTerm,
      store,
      enquiryNumber,
      enquiryDate,
      logisticDetailsId,
      additionalDetails,
      signature,
      companyId,
      createdBy,
      status,
      ip_address,
      paymentDate,
      POCName,
      POCNumber,
      POCDate,
      OCNumber,
      OCDate,
      transporterName,
      TGNumber,
      TDNumber,
      TDDate,
      VehicleNumber,
      replyDate,
      Attention,
      invoiceNumber,
      invoiceDate,
      billDate,
      returnRecieveDate,
      creditNoteNumber,
      creditNotedate,
      quotationNumber,
      quotationDate,
      orderConfirmationNumber,
      orderConfirmationDate,
      purchaseOrderNumber,
      purchaseOrderDate,
      grn_number,
      grn_Date,
      indent_number,
      indent_date,
      supplier_invoice_number,
      supplier_invoice_date,
      challan_number,
      challan_date,
      debit_note_number,
      debit_note_date,
      performaInvoiceNumber,
      performaInvoiceDate,
      pay_to_transporter,
      inspection_date,
      BuyerPANNumber,
      isRounded,
      tcsData
    });

    if (documentType === documentTypes.salesQuotation && enquiryNumber) {
      const existingDocument = await models.Documents.findOne({
        where: { documentNumber: enquiryNumber },
      });
    
      if (existingDocument) {
        await existingDocument.update({
          quotationNumber: documentNumber,
          is_refered: true,
        });
      }
    }
    
    const companyTermsCondition = await models.CompanyTermsCondition.create({
      companyId: companyId,
      termsCondition: termsCondition || [],
      ip_address: ip_address,
      documentNumber: document.documentNumber,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await document.update({
      companyTermsConditionId: companyTermsCondition.id
    });

    await Promise.all([
      models.DocumentItems.bulkCreate(
        items.map(item => {
          return ({
            documentNumber: document.documentNumber,
            companyId: companyId,
            itemId: item.itemId,
            itemName: item.itemName,
            HSN: item.HSN,
            UOM: item.UOM,
            quantity: item.quantity,
            price: item.price,
            discountOne: item.discountOne,
            discountTwo: item.discountTwo,
            totalDiscount: item.totalDiscount,
            taxType: item.taxType,
            tax: item.tax,
            totalTax: item.totalTax,
            totalBeforeTax: item.totalBeforeTax,
            totalAfterTax: item.totalAfterTax,
            receivedToday: item.receivedToday || 0,
            pendingQuantity: item.pendingQuantity || 0,
            receivedQuantity: item.receivedQuantity || 0
          })
        })
      ),
      models.DocumentAdditionalCharges.bulkCreate(
        additionalCharges.map(charge => ({
          companyId: companyId,
          documentNumber: document.documentNumber,
          chargingFor: charge.chargingFor,
          price: charge.price,
          tax: charge.tax,
          total: charge.total,
          status: charge.status,
          ip_address: charge.ip_address
        }))
      ),
      models.DocumentBankDetails.create({
        documentNumber: document.documentNumber,
        companyId: companyId,
        bankName: bankDetails.bankName || null,
        accountName: bankDetails.accountName || null,
        accountNumber: bankDetails.accountNumber || null,
        branch: bankDetails.branch || null,
        IFSCCode: bankDetails.IFSCCode || null,
        MICRCode: bankDetails.MICRCode || null,
        address: bankDetails.address || null,
        SWIFTCode: bankDetails.SWIFTCode || null,
        status: bankDetails.status || 1,
        ip_address: bankDetails.ip_address || null,
      }),
      models.DocumentAttachments.bulkCreate(
        attachments.map(attachment => ({
          documentNumber: document.documentNumber,
          companyId: companyId,
          attachmentName: attachment
        }))
      ),
      models.DocumentComments.create(
        {
          documentId: document.id,   // Ensure documentId is used as FK
          commentText: documentComments,
          createdBy: createdBy,
          createdAt: new Date(),
          updatedAt: new Date()
        }),
    ]);

    if (documentType === documentTypes.goodsReceive) {
      const existingItems = await models.Items.findAll({});
      const stores = await models.Store.findAll({});
      const itemsMap = new Map(existingItems.map(existingItem => [existingItem.itemId, existingItem.id]));
      const storesMap = new Map(stores.map(store => [store.name, store.id]));
      await Promise.all([models.StoreItems.bulkCreate(items.map(item => {
        const itemId = itemsMap.get(item.itemId) || null;
        const storeId = storesMap.get(store) || null;
        return {
          storeId,
          itemId,
          quantity: item?.receivedToday || 0,
          status: 1,
          addedBy: createdBy,
          price: item?.price
        }
      })
      ),
      models.StockTransfer.bulkCreate(items.map(item => {
        const itemId = itemsMap.get(item.itemId) || null;
        const storeId = storesMap.get(store) || null;
        return {
          transferNumber: item?.transferNumber,
          fromStoreId: null,
          itemId,
          quantity: item?.receivedToday || 0,
          toStoreId: storeId,
          transferDate: new Date().toISOString(),
          transferredBy: createdBy,
          comment: '',
          companyId,
          price: item?.price,
          documentNumber: document.documentNumber
        }
      })),
      ]
      );
      for (const item of items) {
        const existItem = await models.Items.findOne({
          where: {
            id: itemsMap.get(item.itemId)
          }
        });
        if (existItem) {
          await models.Items.update(
            { currentStock: (item.currentStock || 0) + item.receivedToday },
            {
              where: {
                id: itemsMap.get(item.itemId)
              }
            }
          );
        }

      }
    }

    if ((documentType === documentTypes.invoice && reduceStockOnIV === "true") || (documentType === documentTypes.deliveryChallan && reduceStockOnDC === "true")) {
      const storeId = await models.Store.findOne({
        where: {
          name: store,
          companyId
        }
      });
      console.log('storeId', storeId.id, storeId.name);
      for (const element of items) {
        let price = 0;
        let remainingQuantity = element.quantity;
        const item = await models.Items.findOne({
          where: {
            itemId: element.itemId
          }
        });
        const existingStock = await models.StoreItems.findAll({
          where: { storeId: storeId.id, itemId: item.id },
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
          await models.StockTransfer.create({
            transferNumber: element.transferNumber,
            fromStoreId: storeId.id || null,
            itemId: item.id,
            quantity: -deductQty,
            toStoreId: null,
            transferDate: new Date().toISOString(),
            transferredBy: createdBy,
            comment: '',
            companyId,
            price: element.price,
            documentNumber: document.documentNumber
          });
          price += (stock.price * deductQty);
        }

        await models.Items.update(
          {
            currentStock: item.currentStock - element.quantity,
            price: ((item.price * item.currentStock) - price) / (item.currentStock - element.quantity)
          },
          { where: { id: item.id, companyId } }
        );
      }
    }

    res.status(201).json({
      message: "Document and related data created successfully!"
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Something went wrong', error });
  }
}

async function getDocuments(req, res) {
  const { companyId } = req.body;

  const documents = await models.Documents.findAll({
    where: { companyId },
    include: [
      {
        model: models.LogisticDetails,
        as: 'logisticDetails'
      },
      {
        model: models.Users,
        as: 'creator',
        attributes: ['id', 'name']
      },
    ],
    distinct: true
  });

  if (!documents || documents.length === 0) {
    return res.status(200).json([]);
  }

  const documentNumbers = documents.map(doc => doc.documentNumber);
  const documentIds = documents.map(doc => doc.id);

  const [items, additionalCharges, bankDetails, termsConditions, attachments, documentComments] = await Promise.all([
    models.DocumentItems.findAll({ where: { documentNumber: documentNumbers, companyId }, 
      include: [
        {
          model: models.Items,
          as: 'itemDetails',
          attributes: ['itemId', 'category', 'subCategory', 'microCategory']
        }
      ] 
     }),
    models.DocumentAdditionalCharges.findAll({ where: { documentNumber: documentNumbers, companyId } }),
    models.DocumentBankDetails.findAll({ where: { documentNumber: documentNumbers, companyId } }),
    models.CompanyTermsCondition.findAll({ where: { documentNumber: documentNumbers, companyId } }),
    models.DocumentAttachments.findAll({ where: { documentNumber: documentNumbers, companyId } }),
    models.DocumentComments.findAll({ where: { documentId: documentIds } }),
  ]);

  const formattedResult = documents.map(document => ({
    ...document.toJSON(),
    items: items.filter(item => item.documentNumber === document.documentNumber),
    additionalCharges: additionalCharges.filter(charge => charge.documentNumber === document.documentNumber),
    bankDetails: bankDetails.find(bank => bank.documentNumber === document.documentNumber) || {},
    termsCondition: termsConditions.find(tc => tc.documentNumber === document.documentNumber) || {},
    attachments: attachments.filter(att => att.documentNumber === document.documentNumber),
    documentComments: documentComments.filter(comment => comment.documentId === document.id),
  }));

  res.status(200).json(formattedResult);
}

async function getDocumentById(req, res) {
  try {
    const { documentNumber, companyId } = req.body;

    const document = await models.Documents.findOne({
      where: { documentNumber, companyId },
      include: [{ model: models.LogisticDetails, as: 'logisticDetails' }]
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    const [items, additionalCharges, bankDetails, termsCondition, attachments, documentComments] = await Promise.all([
      models.DocumentItems.findAll({ where: { documentNumber, companyId } }),
      models.DocumentAdditionalCharges.findAll({ where: { documentNumber, companyId } }),
      models.DocumentBankDetails.findOne({ where: { documentNumber, companyId } }),
      models.CompanyTermsCondition.findOne({ where: { companyId, documentNumber } }),
      models.DocumentAttachments.findAll({ where: { documentNumber, companyId } }),
      models.DocumentComments.findAll({ where: { documentId: document.id } })
    ]);

    const response = {
      ...document.toJSON(),
      items,
      additionalCharges,
      bankDetails: bankDetails || {},
      termsCondition: termsCondition
        ? JSON.parse(termsCondition.termsCondition)
        : [],
      attachments: attachments.map(att => att.attachmentName),
      logisticDetails: document.logisticDetails || null,
      documentComments,
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error("Error fetching document:", error);
    return res.status(500).json({ message: "Something went wrong, please try again later!" });
  }
}

async function discardDocument(req, res) {
  const { documentId, companyId } = req.body;

  try {
    // Find the document using documentId and companyId
    const document = await models.Documents.findOne({
      where: { id: documentId, companyId },
    });

    // If the document doesn't exist, return an error
    if (!document) {
      return res.status(404).json({ message: "Document not found!" });
    }

    // Start a transaction to ensure atomicity
    const transaction = await models.sequelize.transaction();

    try {
      // Mark the specified document as discarded
      await models.Documents.update(
        { status: 2 },
        { where: { id: documentId }, transaction }
      );

      // Commit the transaction
      await transaction.commit();

      // Success response
      res.status(200).json({
        message: `Document with ID ${documentId} has been successfully discarded.`,
      });
    } catch (error) {
      // If something goes wrong, roll back the transaction
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    // Catch any errors and send a failure response
    res.status(500).json({
      message: "Something went wrong while discarding the document.",
      error: error.message || error,
    });
  }
}

function deleteDocument(req, res) {
  const { documentId } = req.body;

  // Check if documentId is provided
  if (!documentId) {
    return res.status(400).json({
      message: "Document ID is required",
    });
  }

  // Attempt to delete the document
  models.Documents.destroy({ where: { id: documentId } })
    .then((result) => {
      if (result) {
        // Document was successfully deleted
        res.status(200).json({
          message: "Document deleted successfully",
        });
      } else {
        // No document was found with the given ID
        res.status(404).json({
          message: "Document not found",
        });
      }
    })
    .catch((error) => {
      // Handle errors
      res.status(500).json({
        message: "Something went wrong, please try again later!",
        error: error.message || error,
      });
    });
}

function getPreviewDocuments(req, res) {
  const { documentType } = req.body;

  if (!documentType) {
    return res.status(400).json({ message: "documentType is required" });
  }

  models.PreviewDocument.findAll({
    where: {
      documentType: req.body.documentType,
    },
  })
    .then((previewDocuments) => {
      if (!previewDocuments.length) {
        return res.status(200).json([]);
      }

      res.status(200).json(previewDocuments.map((doc) => doc.toJSON()));
    })
    .catch((error) => {
      console.error("Error fetching preview documents:", error);
      res
        .status(500)
        .json({ message: "Something went wrong, please try again later!" });
    });
}

async function getDocumentItems(req, res) {
  try {
    const { purchaseOrderNumber } = req.body;
    if (!purchaseOrderNumber) {
      return res.status(404).json({ message: 'Purchase order not found.' });
    }

    const purchaseOrders = await models.Documents.findAll({
      where: { purchaseOrderNumber },
      attributes: ['documentNumber']
    });

    if (!purchaseOrders.length) {
      return res.status(200).json({ receivedByItem: {} });
    }

    const documentNumbers = purchaseOrders.map(doc => doc.documentNumber);

    const documentItems = await models.DocumentItems.findAll({
      where: {
        documentNumber: { [Op.in]: documentNumbers }
      },
      attributes: ['itemId', 'receivedToday']
    });

    const receivedByItem = documentItems.reduce((acc, item) => {
      acc[item.itemId] = (acc[item.itemId] || 0) + item.receivedToday;
      return acc;
    }, {});

    res.status(200).json({ receivedByItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
}


module.exports = {
  getDocuments,
  getDocumentById,
  createDocument,
  discardDocument,
  deleteDocument,
  getPreviewDocuments,
  getDocumentItems
};
