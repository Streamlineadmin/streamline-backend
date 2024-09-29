const express = require("express");

const quotationAttachmentsController = require("../controller/documentattachments.controller");

const router = express.Router();

router.post(
  "/addDocumentAttachments",
  quotationAttachmentsController.addDocumentAttachments
);

router.post(
  "/editDocumentAttachments",
  quotationAttachmentsController.editDocumentAttachments
);

router.get("/", quotationAttachmentsController.getDocumentAttachments);

router.post(
  "/deleteDocumentAttachments",
  quotationAttachmentsController.deleteDocumentAttachments
);

// Test route
router.get("/test", (req, res) => {
  res.status(200).json({ message: "Test route working!" });
});

module.exports = router;
