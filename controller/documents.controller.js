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
        grn_Date = null
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
            }),
            models.CompanyTermsCondition.update(
                { termsCondition },
                { where: { companyId } }
            )
        ]);
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
            models.CompanyTermsCondition.findOne({ where: { companyId } })
        ])
        .then(([items, additionalCharges, bankDetails, termsCondition]) => {
            const response = {
                ...document.toJSON(),
                items,
                additionalCharges,
                bankDetails,
                termsCondition: termsCondition ? termsCondition.termsCondition : null
            };

            res.status(200).json(response);
        });
    })
    .catch(error => {
        console.error("Error fetching document:", error);
        res.status(500).json({ message: "Something went wrong, please try again later!" });
    });
}

module.exports = {
    getDocuments,
    getDocumentById,
    createDocument
};
