const models = require("../models");
const { BOMProductionProcess, ProductionProcess } = models;

async function createBOMProductionProcess(req, res) {
  try {
    const { bomId, processes } = req.body;

    if (!bomId || !processes?.length) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const bomProcesses = await models.BOMProductionProcess.bulkCreate(
      processes.map((process) => ({
        bomId,
        processId: process.processId,
      }))
    );

    res.status(201).json({
      message: "Production processes added to BOM successfully",
      data: bomProcesses,
    });
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .json({ message: "Something went wrong!", error: error.message });
  }
}

async function getBOMProductionProcesses(req, res) {
    try {
      const { bomId } = req.params;
  
      const bomWithProcesses = await models.BillOfMaterial.findByPk(bomId, {
        include: [{
          model: models.ProductionProcess,
          through: { attributes: [] },
          attributes: ['id', 'processCode', 'processName', 'description']
        }]
      });
  
      if (!bomWithProcesses) {
        return res.status(404).json({ 
          message: "BOM not found",
          data: null 
        });
      }
  
      res.status(200).json({
        message: "BOM processes retrieved successfully",
        data: bomWithProcesses.ProductionProcesses
      });
  
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ 
        message: "Something went wrong!", 
        error: error.message 
      });
    }
  }

async function updateBOMProductionProcess(req, res) {
  try {
    const { bomId, processIds } = req.body;
    if (!bomId || !Array.isArray(processIds)) {
      return res
        .status(400)
        .json({ message: "bomId and processIds[] are required" });
    }
    // Remove old links
    await BOMProductionProcess.destroy({ where: { bomId } });
    // Create new links
    const payload = processIds.map((procId, idx) => ({
      bomId,
      processId: procId,
      sequence: idx + 1,
    }));
    const result = await BOMProductionProcess.bulkCreate(payload, {
      validate: true,
    });
    return res
      .status(200)
      .json({ message: "BOM processes updated", data: result });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
}

async function deleteBOMProductionProcess(req, res) {
  try {
    const { id } = req.params;
    const count = await BOMProductionProcess.destroy({ where: { id } });
    if (count === 0) {
      return res.status(404).json({ message: "Entry not found" });
    }
    return res.status(200).json({ message: "BOM process link deleted" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
}

module.exports = {
  createBOMProductionProcess: createBOMProductionProcess,
  getBOMProductionProcesses: getBOMProductionProcesses,
  updateBOMProductionProcess: updateBOMProductionProcess,
  deleteBOMProductionProcess: deleteBOMProductionProcess,
};
