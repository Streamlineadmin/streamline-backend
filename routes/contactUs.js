const express = require("express");
const router = express.Router();

const contactUsController = require("../controller/contactUs.controller")

router.post("/addContactUs", contactUsController.addContactUs); 
router.post("/", contactUsController.getContactUs);

module.exports = router;
