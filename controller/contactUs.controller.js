const models = require("../models");

async function addContactUs(req, res) {
  try {
    const { name, email, message, ip_address } = req.body;

    // Validate request body
    if (!name || !email || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Insert data into the database
    const newContact = await ContactUs.create({
      name,
      email,
      message,
      ip_address,
    });

    return res.status(201).json({
      message: "Form submitted successfully",
      data: newContact,
    });
  } catch (error) {
    console.error("Error submitting form:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getContactUs(req, res) {
  try {
    const contactUsDetails = await models.ContactUs.findAll();
    return res.status(200).json({ data: contactUsDetails });
  } catch (error) {
    console.error("Error fetching contact records:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
module.exports = {
  addContactUs: addContactUs,
  getContactUs: getContactUs,
};
