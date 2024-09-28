const models = require("../models");

function addQuotationDocuments(req, res) {
  // check if documents name already exists for the given company
  models.QuotationDocuments.findOne({
    where: {
      documentType: req.body.documentType,
      documentNumber: req.body.documentNumber,
      companyId: req.body.companyId,
    },
  })
    .then((quotationDocuments) => {
      if (quotationDocuments) {
        return res.status(409).json({
          message: "Documents already exists!",
        });
      } else {
        // Document not exist, proceed to create
        const documents = {
          documentType: req.body.documentType,
          documentNumber: req.body.documentNumber,
          buyerName: req.body.buyerName,
          buyerBillingAddress: req.body.buyerBillingAddress,
          buyerDeliveryAddress: req.body.buyerDeliveryAddress,
          buyerContactNumber: req.body.buyerContactNumber,
          buyerEmail: req.body.buyerEmail,
          supplierName: req.body.supplierName,
          supplierBillingAddress: req.body.supplierBillingAddress,
          supplierDeliverAddress: req.body.supplierDeliverAddress,
          supplierContactNo: req.body.supplierContactNo,
          supplierEmail: req.body.supplierEmail,
          documentDate: req.body.documentDate,
          ammendment: req.body.ammendment,
          deliveryDate: req.body.deliveryDate,
          paymentTerm: req.body.paymentTerm,
          store: req.body.store,
          enquiryNumber: req.body.enquiryNumber,
          enquiryDate: req.body.enquiryDate,
          logisticDetails: req.body.logisticDetails,
          additionalDetails: req.body.additionalDetails,
          signature: req.body.signature,
          companyId: req.body.companyId,
          createdBy: req.body.createdBy,
          status: req.body.status,
          ip_address: req.body.ip_address,
          createdAt: req.body.createdAt,
          updatedAt: req.body.updatedAt,
        };

        models.QuotationDocuments.create(documents)
          .then((result) => {
            res.status(201).json({
              message: "Document created successfully",
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

function getQuotationDocuments(res, req) {
  models.QuotationDocuments.findAll({
    where: {
      companyID: req.body.companyID,
    },
  })
    .then((result) => {
      if (!result || result.length === 0) {
        return res.status(200).json([]);
      }
      res.status(200).json(result);
    })
    .catch((error) => {
      console.error("Error fetching documents:", error);
      res.status(500).json({
        message: "Something went wrong, please try again later!",
      });
    });
}

function deleteQuotationDocuments(req, res) {
  const documentId = req.body.documentId;

  models.QuotationDocuments.destroy({ where: { id: documentId } })
    .then((result) => {
      if (result) {
        res.status(200).json({
          message: "Doccuments deleted successfully",
        });
      } else {
        res.status(200).json({
          message: "Document not found",
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

function editQuotationDocuments(req, res) {
  const documentType = req.body.documentType;
  const buyerBillingAddress = req.body.buyerBillingAddress;
  const buyerName = req.body.buyerName;
  const buyerDeliveryAddress = req.body.buyerDeliveryAddress;
  const buyerContactNumber = req.body.buyerContactNumber;
  const buyerEmail = req.body.buyerEmail;
  const supplierName = req.body.supplierName;
  const supplierBillingAddress = req.body.supplierBillingAddress;
  const supplierDeliverAddress = req.body.supplierDeliverAddress;
  const supplierContactNo = req.body.supplierContactNo;
  const supplierEmail = req.body.supplierEmail;
  const documentDate = req.body.documentDate;
  const ammendment = req.body.ammendment;
  const deliveryDate = req.body.deliveryDate;
  const paymentTerm = req.body.paymentTerm;
  const store = req.body.store;
  const enquiryNumber = req.body.enquiryNumber;
  const enquiryDate = req.body.enquiryDate;
  const logisticDetails = DataTypes.logisticDetails;
  const additionalDetails = DataTypes.additionalDetails;
  const signature = req.body.signature;

  const updatedDocumentData = {
    documentType,
    buyerBillingAddress,
    buyerName,
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
    status: req.body.status || 1,
    ip_address: req.body.ip_address,
    createdBy: req.body.createdBy,
  };

  // Check if the documents name already exists  
  models.QuotationDocuments.findOne({
    where: {
      documentId: req.body.documentId,
      // More check ?
    },
  })
    .then((existingDocument) => {
      if (existingDocument) {
        return res.status(409).json({
          message: "Document already exists for this company!",
        });
      } else {
        models.QuotationDocuments.update(updatedDocumentData, {
          where: {
            documentId: req.body.documentId,
          },
        })
          .then((result) => {
            if (result[0] > 0) {
              res.status(200).json({
                message: "Document series updated successfully",
                post: updatedDocumentSeriesData,
              });
            } else {
              res.status(404).json({
                message: "Document  not found",
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

module.exports = {
  addQuotationDocuments: addQuotationDocuments,
  getQuotationDocuments: getQuotationDocuments,
  editQuotationDocuments: editQuotationDocuments,
  deleteQuotationDocuments: deleteQuotationDocuments,
};
