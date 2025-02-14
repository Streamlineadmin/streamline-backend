const models = require("../models");

async function addDemoQuery(req, res) {
  try {
    const {
      fullName,
      email,
      phone,
      companyName,
      companyWebsite,
      industry,
      companySize,
      currentERP,
      modules,
      query,
      source,
      ip_address,
    } = req.body;

    if (!fullName || !email || !query) {
      return res
        .status(400)
        .json({ message: "Please fill all mandatory fields." });
    }

    const newDemoData = await models.DemoQuery.create({
      name: fullName,
      email,
      phone,
      companyName,
      companyWebsite,
      industry,
      companySize,
      currentERP,
      modules: Array.isArray(modules) ? JSON.stringify(modules) : modules, 
      query,
      source,
      ip_address,
    });

    return res.status(201).json({
      message: "Demo request submitted successfully",
      data: newDemoData,
    });
  } catch (error) {
    console.error("Error submitting demo request:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getDemoQuery(req, res) {
  try {
    const demoRequests = await models.DemoQuery.findAll(); 

    return res.status(200).json({
      message: "Demo requests fetched successfully",
      data: demoRequests,
    });
  } catch (error) {
    console.error("Error fetching demo requests:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  addDemoQuery: addDemoQuery,
  getDemoQuery: getDemoQuery,
};
