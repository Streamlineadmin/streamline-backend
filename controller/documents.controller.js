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
        items = [] // Add items array to request body
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
            documentNumber: document.documentNumber, // Use the created document's number
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
        return models.DocumentItems.bulkCreate(documentItems);
    })
    .then(() => {
        res.status(201).json({ message: "Document and items created successfully!" }); // Return success message
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
    }).then(result => {
        if (!result || result.length === 0) {
            return res.status(200).json([]);
        }
        res.status(200).json(result);
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
    
}


module.exports = {
    getDocuments: getDocuments,
    getDocumentById: getDocumentById,
    createDocument: createDocument
}