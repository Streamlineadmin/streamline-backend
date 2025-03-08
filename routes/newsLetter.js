const express = require("express");
const router = express.Router();

const newsLetterController = require("../controller/newsLetter.controller");

router.post("/addNewsLetters", newsLetterController.addNewsLetter); 
router.post("/unSubscribeNewsLetter", newsLetterController.unSubscribeNewsLetter); 
router.get("/", newsLetterController.getAllNewsLetters);

module.exports = router;
