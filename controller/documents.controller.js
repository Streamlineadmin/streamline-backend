const models = require('../models');

async function createDocument(req, res) {
    const {
        documentTemplateId = null,
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
        pay_to_transporter = null,
        inspection_date = null,
        attachments = [],
        documentComments = null,
    } = req.body;

    const document = await models.Documents.create({
        documentTemplateId,
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
        pay_to_transporter,
        inspection_date,
    });

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
                totalAfterTax: item.totalAfterTax,
                receivedQuantity: item.receivedQuantity,
                receivedToday:  item.receivedToday,
                pendingQuantity:  item.pendingQuantity,
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
        models.DocumentAttachments.bulkCreate(
            attachments.map(attachment => ({
                documentNumber: document.documentNumber,
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
        models.StoreItems.bulkCreate(
          items.map(item => ({
            storeId: store,
            itemId: item.id,
            quantity: item.receivedToday,
            status: 1,
            addedBy: companyId,
            price: item?.price,
          }))
        ),
        models.StockTransfer.bulkCreate(
          items.map(item => ({
            transferNumber: null,
            fromStoreId: null,
            itemId: item.id,
            quantity: item.receivedToday,
            toStoreId: store,
            companyId,
            price: item.price,
          }))
        ),
    ]);

    res.status(201).json({
        message: "Document and related data created successfully!"
    });
}

async function getDocuments(req, res) {
    const { companyId } = req.body;

    const documents = await models.Documents.findAll({
        where: { companyId },
        include: [{ model: models.LogisticDetails, as: 'logisticDetails' }]
    });

    if (!documents || documents.length === 0) {
        return res.status(200).json([]);
    }

    const documentNumbers = documents.map(doc => doc.documentNumber);
    const documentIds = documents.map(doc => doc.id);

    const [items, additionalCharges, bankDetails, termsConditions, attachments, documentComments] = await Promise.all([
        models.DocumentItems.findAll({ where: { documentNumber: documentNumbers } }),
        models.DocumentAdditionalCharges.findAll({ where: { documentNumber: documentNumbers } }),
        models.DocumentBankDetails.findAll({ where: { documentNumber: documentNumbers } }),
        models.CompanyTermsCondition.findAll({ where: { documentNumber: documentNumbers } }),
        models.DocumentAttachments.findAll({ where: { documentNumber: documentNumbers } }),
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
            where: { documentNumber },
            include: [{ model: models.LogisticDetails, as: 'logisticDetails' },
                      { model: models.DocumentTemplates, as: 'documentTemplate' }]
        });

        if (!document) {
            return res.status(404).json({ message: "Document not found" });
        }

        const [items, additionalCharges, bankDetails, termsCondition, attachments, documentComments] = await Promise.all([
            models.DocumentItems.findAll({ where: { documentNumber } }),
            models.DocumentAdditionalCharges.findAll({ where: { documentNumber } }),
            models.DocumentBankDetails.findOne({ where: { documentNumber } }),
            models.CompanyTermsCondition.findOne({ where: { companyId, documentNumber } }),
            models.DocumentAttachments.findAll({ where: { documentNumber } }),
            models.DocumentComments.findAll({ where: { documentId: document.id } })
        ]);

        const response = {
            ...document.toJSON(),
            documentTemplateId: document.documentTemplateId,
            items,
            additionalCharges,
            bankDetails: bankDetails || {},
            termsCondition: termsCondition
                ? JSON.parse(termsCondition.termsCondition)
                : [],
            attachments: attachments.map(att => att.attachmentName),
            logisticDetails: document.logisticDetails || null,
            documentComments,
            template: document.documentTemplate?.template || null,
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

module.exports = {
    getDocuments,
    getDocumentById,
    createDocument,
    discardDocument,
    deleteDocument,
    getPreviewDocuments,
};
