const models = require('../models');
const { Op } = require('sequelize');

async function createGateEntry(req, res) {
    try {
        const { userId, documentNumber, visitorName, visitorContact,
            visitorEmail, visitorCompany, idProofType, idProofNumber,
            purposeOfVisit, visitorImageUrl, personToMeet, vehicleNumber,
            vehicleType, comments, companyId, securitySignatureUrl, seriesId } = req.body;

        const result = await models.GateEntry.create({
            userId,
            documentNumber,
            visitorName,
            visitorContact,
            visitorEmail,
            visitorCompany,
            idProofType,
            idProofNumber,
            purposeOfVisit,
            visitorImageUrl,
            personToMeet,
            vehicleNumber,
            vehicleType,
            comments,
            companyId,
            status: 0,
            securitySignatureUrl,
        });

        if (seriesId) {
            await models.DocumentSeries.increment('nextNumber', { where: { id: seriesId } });
        }

        return res.status(201).json({
            message: "Gate Entry Created successfully",
            data: result
        });
    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong, please try again later!",
            error: error.message || error
        });
    }
}

async function getAllGateEntries(req, res) {
  try {
    const {
      companyId,
      dateRange = [],
      currentPage,
      pageSize,
      search = "",
      visitorName,
      documentNumber,
      exitStatus
    } = req.body;
 
    const users = await models.Users.findAll({
      where: { companyId },
      attributes: ["id", "name", "email", "contactNo"],
      raw: true,
    });
    const userMap = users.reduce((map, user) => {
      map[user.id] = user;
      return map;
    }, {});
 
    const offset = ((currentPage || 1) - 1) * (pageSize || 10);
 
    const whereConditions = [{ companyId }];
 
    let dateFilter = {};
    if (dateRange && Array.isArray(dateRange) && dateRange.length === 2) {
      const [startDate, endDate] = dateRange;
      dateFilter = {
        createdAt: {
          [Op.between]: [
            new Date(startDate + "T00:00:00.000Z"),
            new Date(endDate + "T23:59:59.999Z"),
          ],
        },
      };
      whereConditions.push(dateFilter);
    }
 
    const searchTerms = Array.isArray(search)
      ? search.filter((val) => val && val.trim() !== "")
      : [];
    if (searchTerms.length > 0) {
      whereConditions.push({
        [Op.or]: searchTerms.flatMap((val) => [
          { documentNumber: { [Op.like]: `%${val.trim()}%` } },
          { visitorCompany: { [Op.like]: `%${val.trim()}%` } },
          { visitorName: { [Op.like]: `%${val.trim()}%` } },
        ]),
      });
    }
 
    if (Array.isArray(visitorName) && visitorName.length > 0) {
      const visitorNameTerms = visitorName.filter(
        (val) => val && val.trim() !== ""
      );
      if (visitorNameTerms.length > 0) {
        whereConditions.push({
          [Op.or]: visitorNameTerms.map((val) => ({
            visitorName: { [Op.like]: `%${val.trim()}%` },
          })),
        });
      }
    } else if (visitorName) {
      whereConditions.push({
        visitorName: { [Op.like]: `%${visitorName.trim()}%` },
      });
    }
 
    if (Array.isArray(documentNumber) && documentNumber.length > 0) {
      const documentNumberTerms = documentNumber.filter(
        (val) => val && val.trim() !== ""
      );
      if (documentNumberTerms.length > 0) {
        whereConditions.push({
          [Op.or]: documentNumberTerms.map((val) => ({
            documentNumber: { [Op.like]: `%${val.trim()}%` },
          })),
        });
      }
    } else if (documentNumber) {
      whereConditions.push({
        documentNumber: { [Op.like]: `%${documentNumber.trim()}%` },
      });
    }
 
    if (exitStatus && Array.isArray(exitStatus) && exitStatus.length > 0) {
      whereConditions.push({
        status: { [Op.in]: exitStatus },
      });
    }
 
    const whereClause =
      whereConditions.length === 1
        ? whereConditions[0]
        : { [Op.and]: whereConditions };
 
    let gateEntries = [];
    if (!currentPage || !pageSize) {
      gateEntries = await models.GateEntry.findAndCountAll({
        where: whereClause,
        order: [["createdAt", "DESC"]],
        raw: true,
      });
    } else {
      gateEntries = await models.GateEntry.findAndCountAll({
        where: whereClause,
        order: [["createdAt", "DESC"]],
        offset,
        limit: pageSize,
        raw: true,
      });
    }
 
    gateEntries.rows.forEach((entry) => {
      entry.user = userMap[entry.userId] || null;
    });
    return res.status(200).json({
      data: gateEntries.rows,
      ...(currentPage && pageSize ? { currentPage, pageSize } : {}),
      total: gateEntries.count,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong, please try again later!",
      error: error.message || error,
    });
  }
}

async function updateGateEntry(req, res) {
    try {
        const { id } = req.body;

        const gateEntry = await models.GateEntry.findByPk(id);
        if (!gateEntry) {
            return res.status(404).json({
                message: "Gate Entry not found"
            });
        }
        await gateEntry.update({
            status: 1,
        });
        res.status(200).json({
            message: "Gate Entry updated successfully",
            data: gateEntry
        });
    } catch (error) {
        res.status(500).json({
            message: "Something went wrong, please try again later!",
            error: error.message || error
        });
    }
}

async function getGateEntriesById(req, res) {
    try {
        const { id } = req.body;
        const gateEntry = await models.GateEntry.findByPk(id);
        if (!gateEntry) {
            return res.status(404).json({
                message: "Gate Entry not found"
            });
        }
        return res.status(200).json({
            data: gateEntry
        });
    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong, please try again later!",
            error: error.message || error
        });
    }
}

module.exports = {
    createGateEntry,
    updateGateEntry,
    getGateEntriesById,
    getAllGateEntries
}