const models = require('../models');

function createDocument(req, res) {
    const {
        documentType = null,
        documentNumber = null,
        buyerName = null,
        buyerBillingAddress = null,
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
        logisticDetails = null,
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
        pay_to_transporter = null,
        inspection_date = null,
        attachments = [],
    } = req.body;

    models.Documents.create({
        documentType,
        documentNumber,
        buyerName,
        buyerBillingAddress,
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
        logisticDetails,
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
        indent_number,
        indent_date,
        supplier_invoice_number,
        supplier_invoice_date,
        challan_number,
        challan_date,
        debit_note_number,
        pay_to_transporter,
        inspection_date,
        quotationNumber,
        quotationDate,
        orderConfirmationNumber,
        orderConfirmationDate,
        purchaseOrderNumber,
        purchaseOrderDate,
        grn_number,
        grn_Date
    })
    .then(document => {
        return Promise.all([
            models.DocumentItems.bulkCreate(
                items.map(item => ({
                    documentNumber: document.documentNumber,
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
                    totalAfterTax: item.totalAfterTax
                }))
            ),
            models.DocumentAdditionalCharges.bulkCreate(
                additionalCharges.map(charge => ({
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
            models.CompanyTermsCondition.update(
                { termsCondition },
                { where: { companyId } }
            ),
            models.DocumentAttachments.bulkCreate(
                attachments.map(attachment => ({
                    documentNumber: document.documentNumber,
                    attachmentName: attachment
                }))
            )
        ]);
    })
    .then(() => {
        res.status(201).json({ message: "Document, items, additional charges, bank details, attachments, and terms condition updated successfully!" });
    })
    .catch(error => {
        console.error("Error adding document:", error);
        res.status(500).json({
            message: "Something went wrong, please try again later!"
        });
    });
}

async function editDocument(req, res) {
  const {
    documentId,  
    documentType,
    documentNumber,
    buyerName,
    buyerBillingAddress,
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
    logisticDetails,
    additionalDetails,
    signature,
    companyId,
    updatedBy,
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
    items = [],
    additionalCharges = [],
    bankDetails = {},
    termsCondition = null,
  } = req.body;

  if (!documentId) {
    return res.status(400).json({
      message: "Document ID is required for editing",
    });
  }

  try {
    // Update the main document
    const documentUpdate = await models.Documents.update(
      {
        documentType,
        documentNumber,
        buyerName,
        buyerBillingAddress,
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
        logisticDetails,
        additionalDetails,
        signature,
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
        updatedBy,
      },
      { where: { id: documentId } }
    );

    if (!documentUpdate[0]) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    // Update items
    await models.DocumentItems.destroy({ where: { documentNumber } });
    await models.DocumentItems.bulkCreate(
      items.map((item) => ({
        documentNumber,
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
      }))
    );

    // Update additional charges
    await models.DocumentAdditionalCharges.destroy({
      where: { documentNumber },
    });
    await models.DocumentAdditionalCharges.bulkCreate(
      additionalCharges.map((charge) => ({
        documentNumber,
        chargingFor: charge.chargingFor,
        price: charge.price,
        tax: charge.tax,
        total: charge.total,
        status: charge.status,
        ip_address: charge.ip_address,
      }))
    );

    // Update bank details
    await models.DocumentBankDetails.update(
      {
        bankName: bankDetails.bankName,
        accountName: bankDetails.accountName,
        accountNumber: bankDetails.accountNumber,
        branch: bankDetails.branch,
        IFSCCode: bankDetails.IFSCCode,
        MICRCode: bankDetails.MICRCode,
        address: bankDetails.address,
        SWIFTCode: bankDetails.SWIFTCode,
        status: bankDetails.status,
        ip_address: bankDetails.ip_address,
      },
      { where: { documentNumber } }
    );

    // Update terms and conditions
    if (termsCondition) {
      await models.CompanyTermsCondition.update(
        { termsCondition },
        { where: { companyId } }
      );
    }

    res.status(200).json({
      message:
        "Document, items, additional charges, bank details, and terms condition updated successfully!",
    });
  } catch (error) {
    console.error("Error editing document:", error);
    res.status(500).json({
      message: "Something went wrong, please try again later!",
      error: error.message || error,
    });
  }
}

function getDocuments(req, res) {
    models.Documents.findAll({
        where: {
            companyId: req.body.companyId
        }
    })
    .then(documents => {
        if (!documents || documents.length === 0) {
            return res.status(200).json([]);
        }

        const documentNumbers = documents.map(doc => doc.documentNumber);

        return Promise.all([
            models.DocumentItems.findAll({ where: { documentNumber: documentNumbers } }),
            models.DocumentAdditionalCharges.findAll({ where: { documentNumber: documentNumbers } }),
            models.DocumentBankDetails.findAll({ where: { documentNumber: documentNumbers } }),
            models.CompanyTermsCondition.findOne({ where: { companyId: req.body.companyId } })
        ])
        .then(([items, additionalCharges, bankDetails, termsCondition]) => {
            const formattedResult = documents.map(document => ({
                ...document.toJSON(),
                items: items.filter(item => item.documentNumber === document.documentNumber),
                additionalCharges: additionalCharges.filter(charge => charge.documentNumber === document.documentNumber),
                bankDetails: bankDetails.filter(bank => bank.documentNumber === document.documentNumber),
                termsCondition: termsCondition ? termsCondition.termsCondition : null
            }));

            res.status(200).json(formattedResult);
        });
    })
    .catch(error => {
        console.error("Error fetching documents:", error);
        res.status(500).json({
            message: "Something went wrong, please try again later!"
        });
    });
}

function getDocumentById(req, res) {
    const { documentNumber, companyId } = req.body;

    models.Documents.findOne({ where: { documentNumber } })
    .then(document => {
        if (!document) {
            return res.status(404).json({ message: "Document not found" });
        }

        return Promise.all([
            models.DocumentItems.findAll({ where: { documentNumber } }),
            models.DocumentAdditionalCharges.findAll({ where: { documentNumber } }),
            models.DocumentBankDetails.findAll({ where: { documentNumber } }),
            models.CompanyTermsCondition.findOne({ where: { companyId } }),
            models.DocumentAttachments.findAll({ where: { documentNumber } }),
        ])
        .then(([items, additionalCharges, bankDetails, termsCondition, attachments]) => {
            const response = {
                ...document.toJSON(),
                items,
                additionalCharges,
                bankDetails,
                termsCondition: termsCondition ? termsCondition.termsCondition : null,
                attachments: attachments.map(attachment => attachment.attachmentName),
            };

            res.status(200).json(response);
        });
    })
    .catch(error => {
        console.error("Error fetching document:", error);
        res.status(500).json({ message: "Something went wrong, please try again later!" });
    });
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

module.exports = {
    getDocuments,
    getDocumentById,
    createDocument,
    editDocument,
    discardDocument,
    deleteDocument,
    getPreviewDocuments,
};
