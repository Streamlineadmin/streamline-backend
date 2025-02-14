const models = require("../models");

async function addRequestedDemoData(req, res) {
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
      consultation,
      ip_address,
    } = req.body;

    if (!fullName || !email || !query) {
      return res
        .status(400)
        .json({ message: "Please fill all mandatory fields." });
    }

    const newDemoData = await models.RequestedDemo.create({
      fullName,
      email,
      phone,
      companyName,
      companyWebsite,
      industry,
      companySize,
      currentERP,
      modules: JSON.stringify(modules),
      query,
      source,
      consultation,
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

async function getAllRequestedDemos(req, res) {
  try {
    const demoRequests = await models.RequestedDemoModel.findAll(); // Fetch all records

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
  addRequestedDemoData: addRequestedDemoData,
  getAllRequestedDemos: getAllRequestedDemos,
};
