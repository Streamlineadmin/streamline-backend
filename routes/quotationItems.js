const express = require("express"); 

const quotationItemsController = require("../controller/documentItems.controller");

const router = express.Router();

router.post(
  "/addDocumentItems",
  quotationItemsController.addDocumentItems
);

router.post(
  "/editDocumentItems",
  quotationItemsController.editDocumentItems
);

router.get("/", quotationItemsController.getDocumentItems);

router.post(
  "/deleteDocumentItems",
  quotationItemsController.deleteDocumentItems
);

module.exports = router;

