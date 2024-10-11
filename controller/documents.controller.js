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
        bankDetails = {}, // Add bank details object to request body
        termsCondition = null // Add terms condition to request body
    } = req.body;

    // Create the document with provided fields (including null values)
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
        creditNotedate
    })
    .then(document => {
        // After successfully creating the document, insert data into DocumentItems
        const documentItems = items.map(item => ({
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
        }));

        // Bulk create DocumentItems
        return models.DocumentItems.bulkCreate(documentItems).then(() => {
            // After inserting DocumentItems, insert additional charges
            const additionalChargesData = additionalCharges.map(charge => ({
                documentNumber: document.documentNumber,
                chargingFor: charge.chargingFor,
                price: charge.price,
                tax: charge.tax,
                total: charge.total,
                status: charge.status,
                ip_address: charge.ip_address
            }));

            // Bulk create DocumentAdditionalCharges
            return models.DocumentAdditionalCharges.bulkCreate(additionalChargesData).then(() => {
                // After inserting additional charges, insert bank details
                const bankDetailsData = {
                    documentNumber: document.documentNumber,
                    bankName: bankDetails.bankName,
                    accountName: bankDetails.accountName,
                    accountNumber: bankDetails.accountNumber,
                    branch: bankDetails.branch,
                    IFSCCode: bankDetails.IFSCCode,
                    MICRCode: bankDetails.MICRCode,
                    address: bankDetails.address,
                    SWIFTCode: bankDetails.SWIFTCode,
                    status: bankDetails.status,
                    ip_address: bankDetails.ip_address
                };

                return models.DocumentBankDetails.create(bankDetailsData).then(() => {
                    // Update CompanyTermsCondition
                    return models.CompanyTermsCondition.update(
                        { termsCondition },
                        { where: { companyId } }
                    );
                });
            });
        });
    })
    .then(() => {
        res.status(201).json({ message: "Document, items, additional charges, bank details, and terms condition updated successfully!" });
    })
    .catch(error => {
        console.error("Error adding document:", error);
        res.status(500).json({
            message: "Something went wrong, please try again later!"
        });
    });
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

        // Extract document numbers
        const documentNumbers = documents.map(doc => doc.documentNumber);

        // Fetch DocumentItems, DocumentAdditionalCharges, and DocumentBankDetails based on the documentNumbers
        return Promise.all([
            models.DocumentItems.findAll({
                where: {
                    documentNumber: documentNumbers
                }
            }),
            models.DocumentAdditionalCharges.findAll({
                where: {
                    documentNumber: documentNumbers
                }
            }),
            models.DocumentBankDetails.findAll({
                where: {
                    documentNumber: documentNumbers
                }
            }),
            models.CompanyTermsCondition.findAll({
                where: {
                    companyId: req.body.companyId // Fetch terms conditions based on companyId
                }
            })
        ]).then(([items, additionalCharges, bankDetails, termsConditions]) => {
            // Format the result to include items, additional charges, bank details, and terms conditions in the documents
            const formattedResult = documents.map(document => {
                return {
                    ...document.toJSON(),
                    items: items.filter(item => item.documentNumber === document.documentNumber) || [],
                    additionalCharges: additionalCharges.filter(charge => charge.documentNumber === document.documentNumber) || [],
                    bankDetails: bankDetails.filter(bank => bank.documentNumber === document.documentNumber) || [],
                    termsCondition: termsConditions.length > 0 ? termsConditions[0].termsCondition : null // Assuming only one terms condition per company
                };
            });

            // Return the formatted result
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
    const documentNumber = req.body.documentNumber;
    const companyId = req.body.companyId; // Assuming companyId is also passed in the request body

    // Fetch the document by documentNumber
    models.Documents.findOne({
        where: { documentNumber: documentNumber }
    })
    .then(document => {
        if (!document) {
            return res.status(404).json({
                message: "Document not found"
            });
        }

        // Fetch associated data based on documentNumber and companyId
        return Promise.all([
            models.DocumentItems.findAll({
                where: { documentNumber: documentNumber }
            }),
            models.DocumentAdditionalCharges.findAll({
                where: { documentNumber: documentNumber }
            }),
            models.DocumentBankDetails.findAll({
                where: { documentNumber: documentNumber }
            }),
            models.CompanyTermsCondition.findOne({
                where: { companyId: companyId }
            })
        ]).then(([items, additionalCharges, bankDetails, termsCondition]) => {
            // Format the response to include all relevant data
            const response = {
                ...document.toJSON(), // Include the main document data
                items: items || [], // Include document items
                additionalCharges: additionalCharges || [], // Include additional charges
                bankDetails: bankDetails || [], // Include bank details
                termsCondition: termsCondition ? termsCondition.termsCondition : null // Include terms condition if available
            };

            res.status(200).json(response);
        });
    })
    .catch(error => {
        console.error("Error fetching document:", error);
        res.status(500).json({
            message: "Something went wrong, please try again later!"
        });
    });
}

    const documentNumber = req.body.documentNumber;

    models.Documents.findOne({
        where: { documentNumber: documentNumber }
    })
    .then(result => {
        if (result) {
            res.status(200).json(result);
        } else {
            res.status(404).json({
                message: "Document not found"
            });
        }
    })
    .catch(error => {
        res.status(500).json({
            message: "Something went wrong, please try again later!"
        });
    });



module.exports = {
    getDocuments: getDocuments,
    getDocumentById: getDocumentById,
    createDocument: createDocument
}