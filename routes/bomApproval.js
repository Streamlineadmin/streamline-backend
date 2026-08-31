const express = require('express');
const bomApprovalController = require('../controller/bomApproval.controller');

const router = express.Router();

router.post('/getBOMApprovals', bomApprovalController.getBOMApprovals);
router.post('/getBOMApprovalById', bomApprovalController.getBOMApprovalById);
router.post('/acceptRejectApproval', bomApprovalController.acceptRejectApproval);
router.post('/setApprovalPermission', bomApprovalController.addApprovalPermission);
router.post('/getApprovalPermission', bomApprovalController.getApprovalPermission);
router.post('/deleteApprovalPermission', bomApprovalController.deleteApprovalPermission);

module.exports = router;
