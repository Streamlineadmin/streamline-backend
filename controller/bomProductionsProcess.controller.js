const models = require("../models");

async function createBOMProductionProcess(req, res) {
  try {
    const { bomId, processes, companyId, userId, status } = req.body;
    if (!processes.length) {
      return res.status(201).json({
        message: "Production processes added to BOM successfully",
        data: [],
      });
    }

    if (!bomId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    await models.BOMProductionProcess.destroy({
      where: {
        bomId
      }
    });

    const bomProcesses = await models.BOMProductionProcess.bulkCreate(
      processes.map((process) => ({
        bomId,
        processId: process.processId,
        processCode: process.processCode,
        processName: process.processName,
        description: process.description,
        plannedTime: process.plannedTime,
        cost: process.cost,
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
          where: { companyId: Number(companyId) },
          required: false,
          attributes: ["id", "processCode", "processName", "description"],
        },
      ],
    });

    // if (!bomProcesses.length) {
    //   return res
    //     .status(404)
    //     .json({ message: "No processes found for this BOM", data: [] });
    // }

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
  const t = await models.sequelize.transaction();

  try {
    const { bomId, processes, companyId, userId, status } = req.body;

    if (!bomId || !Array.isArray(processes)) {
      return res.status(400).json({
        message: "Missing or invalid bomId or processes",
      });
    }

    // Delete all existing processes for this BOM
    await models.BOMProductionProcess.destroy({
      where: { bomId, companyId },
      transaction: t,
    });

    // Create fresh entries
    if (processes.length > 0) {
      await models.BOMProductionProcess.bulkCreate(
        processes.map((process, index) => ({
          bomId,
          processId: process.processId,
          processCode: process.processCode,
          processName: process.processName,
          description: process.description,
          plannedTime: process.plannedTime,
          cost: process.cost,
          companyId,
          status,
          userId,
          sequence: index + 1,
        })),
        { transaction: t }
      );
    }

    await t.commit();

    res.status(200).json({
      message: "BOM processes replaced successfully",
      total: processes.length,
    });
  } catch (error) {
    await t.rollback();

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
