const models = require("../models");

async function addNewsLetter(req, res) {
    try {
      const { email, pageId, ip_address, status } = req.body;
  
      if (!email || !pageId) {
        return res.status(400).json({ message: "Email and Page ID are required" });
      }
  
      const existingNewsLetter = await models.NewsLetter.findOne({ where: { email } });
  
      if (existingNewsLetter) {
        return res.status(409).json({ message: "Email is already subscribed to this page" });
      }
  
      const newsLetter = await models.NewsLetter.create({
        email,
        pageId,
        ip_address,
        status,
      });
  
      return res.status(201).json({
        message: "Newsletter submitted successfully",
        data: newsLetter,
      });
    } catch (error) {
      console.error("Error submitting newsletter:", error);
      return res.status(500).json({ message: "Server error", error: error.message });
    }
  }
  

async function getAllNewsLetters(req, res) {
  try {
    const newsLetters = await models.NewsLetter.findAll();
    return res.status(200).json({ data: newsLetters });
  } catch (error) {
    console.error("Error fetching newsletters:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

async function unSubscribeNewsLetter(req, res) {
    try {
      const { email } = req.body;
  
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
  
      const newsLetter = await models.NewsLetter.findOne({ where: { email } });
  
      if (!newsLetter) {
        return res.status(404).json({ message: "Email not found" });
      }
  
      await newsLetter.update({ status: 0 });
  
      return res.status(200).json({ message: "Unsubscribed successfully" });
    } catch (error) {
      console.error("Error unsubscribing newsletter:", error);
      return res.status(500).json({ message: "Server error" });
    }
  }
module.exports = {
  addNewsLetter: addNewsLetter,
  getAllNewsLetters: getAllNewsLetters,
  unSubscribeNewsLetter: unSubscribeNewsLetter,
};
