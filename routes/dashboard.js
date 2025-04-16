const express = require("express");
const router = express.Router();

const dashboardController = require("../controller/dashboard.controller");

router.post("/getTotalItems", dashboardController.getTotalItems);
router.post("/getTotalStores", dashboardController.getTotalStores);
router.post("/getTotalDocuments", dashboardController.getTotalDocuments);
router.post("/getTotalUsersByCompany", dashboardController.getTotalUsersByCompany);
router.post("/getBuyerSupplierCount", dashboardController.getBuyerSupplierCount);
router.post("/getItemSalesSummary", dashboardController.getItemSalesSummary);
router.post("/getDocumentsInvoiceSummary", dashboardController.getDocumentsInvoiceSummary);
router.post("/predictNext30DaysTotalValue", dashboardController.predictNext30DaysTotalValue);
router.post("/getItemSalesSummaryWithPrediction", dashboardController.getItemSalesSummaryWithPrediction);
router.post("/predictSales", dashboardController.predictSales);
module.exports = router;
