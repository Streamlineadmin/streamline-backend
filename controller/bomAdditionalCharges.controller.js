const models = require("../models");

// Helper to determine approval requirement
async function checkApprovalRequirement(companyId, userId) {
  try {
    const activePermissions = await models.BOMApprovalPermission.findAll({
      where: { companyId: Number(companyId), canApprove: true },
      raw: true,
    });

    // If no approval permissions configured for company, no approval needed
    if (!activePermissions || activePermissions.length === 0) {
      return { requiresApproval: false, hasPermissionsActive: false };
    }

    const user = await models.Users.findOne({
      where: { id: Number(userId) },
      attributes: ["id", "role"],
      raw: true,
    });

    const isAdmin = user && (user.role == 1 || user.role == 2);
    const hasApprovalPermission = activePermissions.some(
      (p) => Number(p.userId) === Number(userId)
    );

    const requiresApproval = !isAdmin && !hasApprovalPermission;
    return { requiresApproval, hasPermissionsActive: true };
  } catch (error) {
    console.error("Error checking approval requirement:", error);
    return { requiresApproval: false, hasPermissionsActive: false };
  }
}

// CREATE - Bulk insert additional charges
async function createBOMAdditionalCharges(req, res) {
  try {
    const { bomId, charges, userId, companyId } = req.body;

    if (!bomId || !charges || !Array.isArray(charges)) {
      return res.status(400).json({ message: "No additional charges provided" });
    }

    const validCharges = charges.filter(
      (item) => item.chargesName?.trim() && item.amount != null
    );

    let createdCharges = [];

    // Insert valid rows only
    if (validCharges.length > 0) {
      const payload = validCharges.map((item) => ({
        bomId,
        chargesName: item.chargesName,
        amount: item.amount,
        userId,
        companyId,
        status: item.status,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      createdCharges = await models.BOMAdditionalCharges.bulkCreate(payload);
    }

    const isFinalSave = charges.some((item) => item.status == 1);
    const isDraftSave = charges.every((item) => item.status == 0);

    if (isFinalSave || isDraftSave) {
      let finalStatus = isDraftSave ? 0 : 1;

      if (isFinalSave) {
        const { requiresApproval, hasPermissionsActive } = await checkApprovalRequirement(
          companyId,
          userId
        );

        if (requiresApproval) {
          finalStatus = 20; // 20 = Pending Approval

          const count = await models.BOMApproval.count({
            where: { companyId: Number(companyId) },
          });

          const bomDetail = await models.BOMDetails.findOne({
            where: { id: bomId },
            raw: true,
          });

          await models.BOMApproval.create({
            approvalId: `BOMA-${count + 1}`,
            bomId: bomDetail?.bomId || `BOM-${bomId}`,
            bomDetailId: Number(bomId),
            bomName: bomDetail?.bomName || "",
            approvalStatus: "Pending",
            requestedBy: Number(userId),
            companyId: Number(companyId),
            status: 1,
          });
        } else if (hasPermissionsActive) {
          // Auto Approved for admin or user with approval permission
          const count = await models.BOMApproval.count({
            where: { companyId: Number(companyId) },
          });

          const bomDetail = await models.BOMDetails.findOne({
            where: { id: bomId },
            raw: true,
          });

          await models.BOMApproval.create({
            approvalId: `BOMA-${count + 1}`,
            bomId: bomDetail?.bomId || `BOM-${bomId}`,
            bomDetailId: Number(bomId),
            bomName: bomDetail?.bomName || "",
            approvalStatus: "Auto Approved",
            requestedBy: Number(userId),
            companyId: Number(companyId),
            approvedBy: Number(userId),
            approvalDate: new Date(),
            status: 1,
          });
        }
      }

      const updateStatusPayload = { status: finalStatus };

      const updatePromises = [
        models.BOMRawMaterial.update(updateStatusPayload, { where: { bomId } }),
        models.BOMFinishedGoods.update(updateStatusPayload, { where: { bomId } }),
        models.BOMProductionProcess.update(updateStatusPayload, { where: { bomId } }),
        models.BOMDetails.update(updateStatusPayload, { where: { id: bomId } }),
      ];

      const [chargesCount, scrapCount] = await Promise.all([
        models.BOMAdditionalCharges.count({ where: { bomId } }),
        models.BOMScrapMaterial.count({ where: { bomId } }),
      ]);

      if (chargesCount > 0) {
        updatePromises.push(
          models.BOMAdditionalCharges.update(updateStatusPayload, { where: { bomId } })
        );
      }

      if (scrapCount > 0) {
        updatePromises.push(
          models.BOMScrapMaterial.update(updateStatusPayload, { where: { bomId } })
        );
      }

      await Promise.all(updatePromises);

      const successMsg =
        finalStatus === 20
          ? "BOM submitted for approval successfully."
          : finalStatus === 0
          ? "BOM saved as draft successfully."
          : "BOM created successfully.";

      return res.status(201).json({
        message: successMsg,
        data: createdCharges,
        status: finalStatus,
      });
    }

    return res.status(201).json({
      message:
        validCharges.length > 0
          ? "Additional charges created successfully, BOM created successfully."
          : "BOM created successfully.",
      data: createdCharges,
    });
  } catch (error) {
    console.error("Create Error:", error);
    res.status(500).json({
      message: "Something went wrong!",
      error: error.message,
    });
  }
}

async function getAllBOMAdditionalCharges(req, res) {
  try {
    const { bomId } = req.body;

    if (!bomId) {
      return res.status(400).json({ message: "bomId is required." });
    }
    const additionalCharges = await models.BOMAdditionalCharges.findAll({
      where: { bomId },
    });
    res.status(200).json({
      message: "Additional charges retrieved successfully",
      data: additionalCharges,
    });
  } catch (error) {
    console.error("Get Error:", error);
    res
      .status(500)
      .json({ message: "Something went wrong!", error: error.message });
  }
}

async function updateBOMAdditionalCharge(req, res) {
  try {
    const { bomId, companyId, userId, charges } = req.body;

    if (!bomId || !Array.isArray(charges)) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    // Fetch existing charges
    const existing = await models.BOMAdditionalCharges.findAll({
      where: { bomId },
      attributes: ["id"],
    });

    const existingIds = existing.map((row) => row.id);
    const incomingIds = charges.filter((item) => item.id).map((item) => Number(item.id));

    const toUpdate = charges.filter((item) => item.id);
    const toCreate = charges.filter((item) => !item.id);
    const toDelete = existingIds.filter((id) => !incomingIds.includes(id));

    // Delete removed charges
    if (toDelete.length) {
      await models.BOMAdditionalCharges.destroy({
        where: { id: toDelete },
      });
    }

    // Update existing
    await Promise.all(
      toUpdate.map((item) =>
        models.BOMAdditionalCharges.update(
          {
            chargesName: item.chargesName,
            amount: item.amount,
            status: item.status,
            updatedBy: userId,
            updatedAt: new Date(),
          },
          { where: { id: item.id } }
        )
      )
    );

    // Create new
    if (toCreate.length) {
      const payload = toCreate.map((item) => ({
        bomId,
        companyId,
        userId,
        chargesName: item.chargesName,
        amount: item.amount,
        status: item.status,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await models.BOMAdditionalCharges.bulkCreate(payload);
    }

    const isFinalSave = charges.some((item) => item.status == 1);
    const isDraftSave = charges.every((item) => item.status == 0);

    if (isFinalSave || isDraftSave) {
      let finalStatus = isDraftSave ? 0 : 1;

      if (isFinalSave) {
        const { requiresApproval, hasPermissionsActive } = await checkApprovalRequirement(
          companyId,
          userId
        );

        if (requiresApproval) {
          finalStatus = 20; // 20 = Pending Approval

          const existingApproval = await models.BOMApproval.findOne({
            where: { bomDetailId: Number(bomId), companyId: Number(companyId) },
          });

          const bomDetail = await models.BOMDetails.findOne({
            where: { id: bomId },
            raw: true,
          });

          if (existingApproval) {
            await existingApproval.update({
              approvalStatus: "Pending",
              requestedBy: Number(userId),
              approvedBy: null,
              approvalDate: null,
              comment: null,
            });
          } else {
            const count = await models.BOMApproval.count({
              where: { companyId: Number(companyId) },
            });

            await models.BOMApproval.create({
              approvalId: `BOMA-${count + 1}`,
              bomId: bomDetail?.bomId || `BOM-${bomId}`,
              bomDetailId: Number(bomId),
              bomName: bomDetail?.bomName || "",
              approvalStatus: "Pending",
              requestedBy: Number(userId),
              companyId: Number(companyId),
              status: 1,
            });
          }
        } else if (hasPermissionsActive) {
          const existingApproval = await models.BOMApproval.findOne({
            where: { bomDetailId: Number(bomId), companyId: Number(companyId) },
          });

          const bomDetail = await models.BOMDetails.findOne({
            where: { id: bomId },
            raw: true,
          });

          if (existingApproval) {
            await existingApproval.update({
              approvalStatus: "Auto Approved",
              approvedBy: Number(userId),
              approvalDate: new Date(),
            });
          } else {
            const count = await models.BOMApproval.count({
              where: { companyId: Number(companyId) },
            });

            await models.BOMApproval.create({
              approvalId: `BOMA-${count + 1}`,
              bomId: bomDetail?.bomId || `BOM-${bomId}`,
              bomDetailId: Number(bomId),
              bomName: bomDetail?.bomName || "",
              approvalStatus: "Auto Approved",
              requestedBy: Number(userId),
              companyId: Number(companyId),
              approvedBy: Number(userId),
              approvalDate: new Date(),
              status: 1,
            });
          }
        }
      }

      const updateStatusPayload = { status: finalStatus };

      await Promise.all([
        models.BOMRawMaterial.update(updateStatusPayload, { where: { bomId } }),
        models.BOMFinishedGoods.update(updateStatusPayload, { where: { bomId } }),
        models.BOMScrapMaterial.update(updateStatusPayload, { where: { bomId } }),
        models.BOMProductionProcess.update(updateStatusPayload, { where: { bomId } }),
        models.BOMAdditionalCharges.update(updateStatusPayload, { where: { bomId } }),
        models.BOMDetails.update(updateStatusPayload, { where: { id: bomId } }),
      ]);

      const successMsg =
        finalStatus === 20
          ? "BOM submitted for approval successfully."
          : finalStatus === 0
          ? "BOM saved as draft successfully."
          : "BOM updated successfully.";

      return res.status(200).json({
        message: successMsg,
        status: finalStatus,
      });
    }

    return res.status(200).json({
      message: "Additional charges synchronized successfully",
    });
  } catch (error) {
    console.error("Upsert Error:", error);
    return res
      .status(500)
      .json({ message: "Something went wrong!", error: error.message });
  }
}

// DELETE - Delete additional charge by ID
async function deleteBOMAdditionalCharge(req, res) {
  try {
    const { id } = req.params;

    const deleted = await models.BOMAdditionalCharges.destroy({
      where: { id },
    });

    if (!deleted) {
      return res.status(404).json({ message: "Additional charge not found" });
    }

    res.status(200).json({ message: "Additional charge deleted successfully" });
  } catch (error) {
    console.error("Delete Error:", error);
    res
      .status(500)
      .json({ message: "Something went wrong!", error: error.message });
  }
}

module.exports = {
  createBOMAdditionalCharges,
  getAllBOMAdditionalCharges,
  updateBOMAdditionalCharge,
  deleteBOMAdditionalCharge,
};
