const express = require("express");
const { Model } = require("sequelize");

const quotationDocumentsController = require("../controller/quotationDocuments.controller");

const router = express.Router();

router.post(
  "/addQuotationDocuments",
  quotationDocumentsController.addQuotationDocuments
);

router.post(
  "/editQuotationDocuments",
  quotationDocumentsController.editQuotationDocuments
);

router.get("/", quotationDocumentsController.getQuotationDocuments);

router.post(
  "/deleteQuotationDocuments",
  quotationDocumentsController.deleteQuotationDocuments
);
module.exports = router;
