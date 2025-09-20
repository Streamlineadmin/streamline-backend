const express = require("express");
const router = express.Router();

const documentApprovalController = require("../controller/documentApproval.controller");

router.post("/setApproval", documentApprovalController.addApprovalPermission);
router.post("/", documentApprovalController.getApprovalPermission);

module.exports = router;
