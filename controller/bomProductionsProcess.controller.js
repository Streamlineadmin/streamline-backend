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
    const { bomId, processes, companyId, userId, status } = req.body;

    if (!bomId || !Array.isArray(processes)) {
      return res
        .status(400)
        .json({ message: "Missing or invalid bomId or processes" });
    }

    const existingProcesses = await models.BOMProductionProcess.findAll({
      where: { bomId, companyId },
    });

    const existingProcessIds = existingProcesses.map((p) => p.processId);
    const newProcessIds = processes.map((p) => p.processId);

    const toAdd = processes
      .map((p, index) => ({
        ...p,
        sequence: index + 1,
      }))
      .filter((p) => !existingProcessIds.includes(p.processId));

    const toDelete = existingProcesses.filter(
      (p) => !newProcessIds.includes(p.processId)
    );

    if (toAdd.length > 0) {
      await models.BOMProductionProcess.bulkCreate(
        toAdd.map((process) => ({
          bomId,
          processId: process.processId,
          companyId,
          status,
          userId,
          sequence: process.sequence,
        }))
      );
    }

    if (toDelete.length > 0) {
      const deleteIds = toDelete.map((p) => p.id);
      await models.BOMProductionProcess.destroy({
        where: { id: deleteIds },
      });
    }

    res.status(200).json({
      message: "BOM processes updated successfully with sequence",
      added: toAdd.map((p) => ({
        processId: p.processId,
        sequence: p.sequence,
      })),
      deleted: toDelete.map((p) => p.processId),
    });
  } catch (error) {
    console.error("Error updating BOM processes:", error);
    res.status(500).json({
      message: "Failed to update BOM processes",
      error: error.message,
    });
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
