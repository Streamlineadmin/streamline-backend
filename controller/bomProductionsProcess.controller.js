const models = require("../models");

async function createBOMProductionProcess(req, res) {
  try {
    const { bomId, processes, companyId, userId, status } = req.body;

    if (!bomId || !processes?.length) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const bomProcesses = await models.BOMProductionProcess.bulkCreate(
      processes.map((process) => ({
        bomId,
        processId: process.processId,
        companyId,
        status,
        userId,
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
    const { bomId, companyId } = req.body;

    if (!bomId || !companyId) {
      return res
        .status(400)
        .json({ message: "Missing bomId or companyId in request body" });
    }

    const bomProcesses = await models.BOMProductionProcess.findAll({
      where: { bomId, companyId },
      include: [
        {
          model: models.ProductionProcess,
          attributes: ["id", "processCode", "processName", "description"],
        },
      ],
    });

    if (!bomProcesses.length) {
      return res
        .status(404)
        .json({ message: "No processes found for this BOM", data: [] });
    }

    res.status(200).json({
      message: "BOM processes retrieved successfully",
      data: bomProcesses,
    });
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .json({ message: "Something went wrong!", error: error.message });
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
