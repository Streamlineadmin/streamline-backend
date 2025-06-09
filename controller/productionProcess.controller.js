const models = require("../models");

// Create a new Production Process
async function createProductionProcess(req, res) {
  try {
    const {
      processCode,
      processName,
      description,
      status,
      companyId,
      userId,
      plannedTime,
      cost,
    } = req.body;

    const existingProcess = await models.ProductionProcess.findOne({
      where: { processCode },
    });
    if (existingProcess) {
      return res.status(409).json({ message: "Process ID already exists!" });
    }

    const newProcess = await models.ProductionProcess.create({
      processCode,
      processName,
      description,
      status,
      companyId,
      userId,
      plannedTime,
      cost,
    });

    res.status(201).json({
      message: "Production Process created successfully",
      data: newProcess,
    });
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .json({ message: "Something went wrong!", error: error.message });
  }
}

async function getAllProductionProcesses(req, res) {
  try {
    const { companyId } = req.body;

    if (!companyId) {
      return res.status(400).json({ message: "companyId is required" });
    }

    const processes = await models.ProductionProcess.findAll({
      where: { companyId },
    });

    res.status(200).json({ data: processes });
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .json({ message: "Something went wrong!", error: error.message });
  }
}

// Get a single Production Process by ID
async function getProductionProcessById(req, res) {
  try {
    const { id } = req.body;
    const process = await models.ProductionProcess.findOne({ where: { id } });

    if (!process) {
      return res.status(404).json({ message: "Production Process not found!" });
    }

    res.status(200).json({ data: process });
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .json({ message: "Something went wrong!", error: error.message });
  }
}

// Update a Production Process
async function updateProductionProcess(req, res) {
  try {
    const { id } = req.body;
    const {
      processCode,
      processName,
      plannedTime,
      cost,
      description,
      status,
      companyId,
      userId,
    } = req.body;

    const process = await models.ProductionProcess.findOne({ where: { id } });

    if (!process) {
      return res.status(404).json({ message: "Production Process not found!" });
    }

    await models.ProductionProcess.update(
      {
        processCode,
        processName,
        description,
        status,
        companyId,
        userId,
        plannedTime,
        cost,
      },
      { where: { id } }
    );

    const updatedProcess = await models.ProductionProcess.findOne({
      where: { id },
    });
    res.status(200).json({
      message: "Production Process updated successfully",
      data: updatedProcess,
    });
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .json({ message: "Something went wrong!", error: error.message });
  }
}

// Delete a Production Process
async function deleteProductionProcess(req, res) {
  try {
    const { id } = req.body;

    const process = await models.ProductionProcess.findOne({ where: { id } });

    if (!process) {
      return res.status(404).json({ message: "Production Process not found!" });
    }

    await models.ProductionProcess.destroy({ where: { id } });
    res
      .status(200)
      .json({ message: "Production Process deleted successfully" });
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .json({ message: "Something went wrong!", error: error.message });
  }
}

module.exports = {
  createProductionProcess: createProductionProcess,
  getAllProductionProcesses: getAllProductionProcesses,
  getProductionProcessById: getProductionProcessById,
  updateProductionProcess: updateProductionProcess,
  deleteProductionProcess: deleteProductionProcess,
};
