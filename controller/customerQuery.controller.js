const models = require("../models");

async function addCustomerQuery(req, res) {
  try {
    const { name, email, query, ip_address } = req.body;

    if (!name || !email || !query) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newQuery = await models.CustomerQuery.create({
      name,
      email,
      query,
      ip_address,
    });

    return res.status(201).json({
      message: "Query submitted successfully",
      data: newQuery,
    });
  } catch (error) {
    console.error("Error submitting query:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getCustomerQuery(req, res) {
  try {
    const queries = await models.CustomerQuery.findAll();
    return res.status(200).json({ data: queries });
  } catch (error) {
    console.error("Error fetching queries:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  addCustomerQuery: addCustomerQuery,
  getCustomerQuery: getCustomerQuery,
};
