const { Op } = require("sequelize");
const models = require("../models");
const { buildRawMaterialTreeWithLevel } = require("../helpers/add-level");

async function getBOMApprovals(req, res) {
  try {
    const { companyId, currentPage, pageSize, filters } = req.body;

    if (!companyId) {
      return res.status(400).json({ message: "companyId is required" });
    }

    const whereCondition = {
      companyId: Number(companyId),
    };

    if (filters) {
      if (filters.approvalId && filters.approvalId[0]) {
        whereCondition.approvalId = {
          [Op.like]: `%${filters.approvalId[0].trim()}%`,
        };
      }
      if (filters.bomId && filters.bomId[0]) {
        whereCondition.bomId = {
          [Op.like]: `%${filters.bomId[0].trim()}%`,
        };
      }
      if (filters.bomName && filters.bomName[0]) {
        whereCondition.bomName = {
          [Op.like]: `%${filters.bomName[0].trim()}%`,
        };
      }
      if (filters.approvalStatus && filters.approvalStatus[0]) {
        whereCondition.approvalStatus = {
          [Op.like]: `%${filters.approvalStatus[0].trim()}%`,
        };
      }
      if (filters.requestedBy && filters.requestedBy[0]) {
        const val = filters.requestedBy[0].trim();
        const matchedUsers = await models.Users.findAll({
          where: {
            [Op.or]: [
              { username: { [Op.like]: `%${val}%` } },
              { name: { [Op.like]: `%${val}%` } },
            ],
          },
          attributes: ["id"],
          raw: true,
        });
        const matchedUserIds = matchedUsers.map((u) => u.id);
        whereCondition.requestedBy = {
          [Op.in]: matchedUserIds,
        };
      }
    }

    let rows = [];
    let total = 0;

    if (currentPage && pageSize) {
      const offset = (Number(currentPage) - 1) * Number(pageSize);
      const limit = Number(pageSize);

      const result = await models.BOMApproval.findAndCountAll({
        where: whereCondition,
        order: [["createdAt", "DESC"]],
        offset,
        limit,
        raw: true,
      });
      rows = result.rows;
      total = result.count;
    } else {
      rows = await models.BOMApproval.findAll({
        where: whereCondition,
        order: [["createdAt", "DESC"]],
        raw: true,
      });
      total = rows.length;
    }

    // Manual population of requester and approver without Sequelize relations
    const userIds = Array.from(
      new Set(rows.flatMap((r) => [r.requestedBy, r.approvedBy]).filter(Boolean))
    );

    let userMap = {};
    if (userIds.length > 0) {
      const users = await models.Users.findAll({
        where: { id: userIds },
        attributes: ["id", "name", "username", "email"],
        raw: true,
      });
      users.forEach((u) => {
        userMap[u.id] = u;
      });
    }

    const enrichedRows = rows.map((r) => ({
      ...r,
      requester: userMap[r.requestedBy] || null,
      approver: userMap[r.approvedBy] || null,
    }));

    return res.status(200).json({
      data: enrichedRows,
      total,
    });
  } catch (error) {
    console.error("Error fetching BOM approvals:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
}

async function getBOMApprovalById(req, res) {
  try {
    const { id, approvalId, bomId, companyId } = req.body;

    const whereClause = {
      ...(companyId ? { companyId: Number(companyId) } : {}),
      ...(id ? { id } : approvalId ? { approvalId } : bomId ? { bomId } : {}),
    };

    const approval = await models.BOMApproval.findOne({
      where: whereClause,
      raw: true,
    });

    if (!approval) {
      return res.status(404).json({ message: "BOM Approval record not found" });
    }

    // Fetch requester and approver manually
    const userIds = [approval.requestedBy, approval.approvedBy].filter(Boolean);
    let userMap = {};
    if (userIds.length > 0) {
      const users = await models.Users.findAll({
        where: { id: userIds },
        attributes: ["id", "name", "username", "email"],
        raw: true,
      });
      users.forEach((u) => {
        userMap[u.id] = u;
      });
    }

    const enrichedApproval = {
      ...approval,
      requester: userMap[approval.requestedBy] || null,
      approver: userMap[approval.approvedBy] || null,
    };

    // Fetch full BOM details manually without relations
    const targetBomId = approval.bomId;
    const bomDetail = await models.BOMDetails.findOne({
      where: {
        bomId: targetBomId,
        ...(approval.companyId ? { companyId: approval.companyId } : {}),
      },
      raw: true,
    });

    let plainBOM = null;
    if (bomDetail) {
      const [
        attachments,
        BOMProductionProcesses,
        finishedGoods,
        rawMaterials,
        scrapMaterials,
        additionalCharges,
      ] = await Promise.all([
        models.BOMAttachments
          ? models.BOMAttachments.findAll({
              where: {
                [Op.or]: [{ BOMID: targetBomId }, { bomId: targetBomId }],
              },
              raw: true,
            }).catch(() => [])
          : [],
        models.BOMProductionProcess
          ? models.BOMProductionProcess.findAll({
              where: { bomId: targetBomId },
              raw: true,
            }).catch(() => [])
          : [],
        models.BOMFinishedGoods
          ? models.BOMFinishedGoods.findAll({
              where: { bomId: targetBomId },
              raw: true,
            }).catch(() => [])
          : [],
        models.BOMRawMaterial
          ? models.BOMRawMaterial.findAll({
              where: { bomId: targetBomId },
              raw: true,
            }).catch(() => [])
          : [],
        models.BOMScrapMaterial
          ? models.BOMScrapMaterial.findAll({
              where: { bomId: targetBomId },
              raw: true,
            }).catch(() => [])
          : [],
        models.BOMAdditionalCharges
          ? models.BOMAdditionalCharges.findAll({
              where: { bomId: targetBomId },
              raw: true,
            }).catch(() => [])
          : [],
      ]);

      let processedRawMaterials = rawMaterials || [];
      if (processedRawMaterials.length > 0) {
        try {
          processedRawMaterials = buildRawMaterialTreeWithLevel(processedRawMaterials);
        } catch (e) {
          // fallback to flat list
        }
      }

      plainBOM = {
        ...bomDetail,
        attachments: attachments || [],
        BOMProductionProcesses: BOMProductionProcesses || [],
        finishedGoods: finishedGoods || [],
        rawMaterials: processedRawMaterials || [],
        scrapMaterials: scrapMaterials || [],
        additionalCharges: additionalCharges || [],
      };
    }

    return res.status(200).json({
      data: {
        approval: enrichedApproval,
        bom: plainBOM,
      },
    });
  } catch (error) {
    console.error("Error fetching BOM approval by ID:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
}

async function acceptRejectApproval(req, res) {
  const t = await models.sequelize.transaction();
  try {
    const { id, approvalId, isApproved, comment, userId, companyId } = req.body;

    const whereClause = {
      ...(companyId ? { companyId: Number(companyId) } : {}),
      ...(id ? { id } : approvalId ? { approvalId } : {}),
    };

    const approval = await models.BOMApproval.findOne({
      where: whereClause,
      transaction: t,
    });

    if (!approval) {
      await t.rollback();
      return res.status(404).json({ message: "BOM approval request not found" });
    }

    const newApprovalStatus = isApproved ? "Approved" : "Rejected";

    await approval.update(
      {
        approvalStatus: newApprovalStatus,
        approvedBy: userId ? Number(userId) : null,
        approvalDate: new Date(),
        comment: comment || null,
      },
      { transaction: t }
    );

    // Update BOMDetails status: 1 for Approved, 30 for Rejected
    await models.BOMDetails.update(
      {
        status: isApproved ? "1" : "30",
      },
      {
        where: {
          bomId: approval.bomId,
          companyId: approval.companyId,
        },
        transaction: t,
      }
    );

    await t.commit();

    return res.status(200).json({
      message: isApproved ? "BOM Approved successfully." : "BOM Rejected successfully.",
      data: approval,
    });
  } catch (error) {
    await t.rollback();
    console.error("Error updating BOM approval status:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
}

async function addApprovalPermission(req, res) {
  try {
    const { companyId, users } = req.body;
    if (!companyId || !Array.isArray(users)) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    for (const element of users) {
      const existing = await models.BOMApprovalPermission.findOne({
        where: {
          companyId: Number(companyId),
          userId: Number(element),
        },
      });

      if (existing) {
        await existing.update({ canApprove: true });
      } else {
        await models.BOMApprovalPermission.create({
          companyId: Number(companyId),
          userId: Number(element),
          canApprove: true,
        });
      }
    }

    return res.status(200).json({
      message: "BOM Approval Permission Updated successfully.",
    });
  } catch (error) {
    console.error("Error setting BOM approval permissions:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function getApprovalPermission(req, res) {
  try {
    const { companyId, userId } = req.body;
    const whereClause = {
      companyId: Number(companyId),
      ...(userId ? { userId: Number(userId) } : {}),
    };

    const approvals = await models.BOMApprovalPermission.findAll({
      where: whereClause,
      raw: true,
    });

    const userIds = (approvals || []).map((a) => a.userId).filter(Boolean);
    let userMap = {};
    if (userIds.length > 0) {
      const users = await models.Users.findAll({
        where: { id: userIds },
        attributes: ["id", "name", "username", "email", "role"],
        raw: true,
      });
      users.forEach((u) => {
        userMap[u.id] = u;
      });
    }

    const enrichedApprovals = (approvals || []).map((a) => {
      const user = userMap[a.userId] || null;
      return {
        ...a,
        user,
        "user.name": user?.name,
        "user.username": user?.username,
        "user.email": user?.email,
        "user.role": user?.role,
      };
    });

    return res.status(200).json({
      data: enrichedApprovals,
    });
  } catch (error) {
    console.error("Error getting BOM approval permissions:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function deleteApprovalPermission(req, res) {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ message: "id is required" });
    }

    await models.BOMApprovalPermission.destroy({
      where: { id },
    });

    return res.status(200).json({
      message: "Permission Deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting BOM approval permission:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  getBOMApprovals,
  getBOMApprovalById,
  acceptRejectApproval,
  addApprovalPermission,
  getApprovalPermission,
  deleteApprovalPermission,
};
