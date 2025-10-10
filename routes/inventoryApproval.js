const express = require('express');
const { Model } = require('sequelize');
const inventoryApprovalController  = require('../controller/inventoryApproval.controller');

const router = express.Router();
router.post('/getInventoryApprovals', inventoryApprovalController.getApprovals);
router.post('/getInventoryApprovalById', inventoryApprovalController.getApprovalById);
router.post('/acceptRejectApproval', inventoryApprovalController.acceptRejectApproval);

module.exports = router;