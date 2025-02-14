const express = require("express");
const router = express.Router();

const customerQueryController = require("../controller/customerQuery.controller");

router.post("/addContactUs", customerQueryController.addCustomerQuery); 
router.post("/", customerQueryController.getCustomerQuery);

module.exports = router;
