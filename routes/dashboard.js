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
router.post("/getDashboardData", dashboardController.getDashboardData);
router.post("/getStoreWiseItems", dashboardController.getStoreWiseItems);
router.post("/getCategoryWiseItems", dashboardController.getCategoryWiseItems);
router.post("/fastMovingSlowMovingItems", dashboardController.fastMovingSlowMovingItems);
router.post("/stockLevelAnalysis", dashboardController.stockLevelAnalysis);
router.post("/stockAgeing", dashboardController.stockAgeing);
router.post("/onTimeDelayProduction", dashboardController.onTimeDelayProduction);
router.post("/workOrderStatus", dashboardController.workOrderStatus);
router.post("/getSalesDashboardDetails", dashboardController.getSalesDashboardDetails);
module.exports = router;
