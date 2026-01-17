
const models = require('../models');

const { Op } = require("sequelize");

async function addTermsCondition(req, res) {
  try {
    const { documentType, userId, companyId, terms, ip_address } = req.body;

    if (
      !documentType ||
      !userId ||
      !companyId ||
      !Array.isArray(terms) ||
      terms.length === 0
    ) {
      return res.status(400).json({
        message:
          "Document Type, User ID, Company ID, and Terms are required.",
      });
    }

    const documentTypes = Array.isArray(documentType)
      ? documentType
      : [documentType];

    const conflict = await models.TermsCondition.findOne({
      where: {
        documentType: { [Op.in]: documentTypes },
        companyId,
        userId,
        [Op.or]: terms.map((t) => ({
          term: t.term,
          description: t.description,
        })),
      },
    });

    if (conflict) {
      return res.status(409).json({
        message: `Term "${conflict.term}" already exists for document type "${conflict.documentType}".`,
      });
    }

    const termsConditions = [];

    for (const docType of documentTypes) {
      for (const term of terms) {
        termsConditions.push({
          companyId,
          userId,
          documentType: docType,
          term: term.term,
          description: term.description,
          ip_address,
          status: 1,
        });
      }
    }

    const createdTerms = await models.TermsCondition.bulkCreate(
      termsConditions,
      { returning: true }
    );

    return res.status(201).json({
      message: "Terms condition(s) added successfully!",
      data: {
        companyId,
        userId,
        documentType: documentTypes,
        ip_address,
        status: 1,
        terms: createdTerms.map((t) => ({
          id: t.id,
          documentType: t.documentType,
          term: t.term,
          description: t.description,
        })),
      },
    });
  } catch (error) {
    console.error("Error creating terms condition:", error);
    return res.status(500).json({
      message:
        "Something went wrong in creating TermsConditions. Please try again later.",
      error: error.message,
    });
  }
}

async function editTermsCondition(req, res) {
  try {
    const { documentType, userId, companyId, ip_address, status = 1, terms } = req.body;

    if (!documentType || !userId || !companyId || !terms) {
      return res.status(400).json({
        message: "Document Type, User ID, Company ID, and Terms are required.",
      });
    }

    // Get all existing terms for this document type, user, and company
    const existingTerms = await models.TermsCondition.findAll({
      where: { companyId, documentType, userId },
    });

    const termIdsInRequest = terms.map(term => term.id).filter(id => id !== null);

    // Find terms to delete (terms in DB that are NOT in the request)
    const termsToDelete = existingTerms.filter(term => !termIdsInRequest.includes(term.id));

    // Delete the missing terms
    if (termsToDelete.length > 0) {
      const deleteIds = termsToDelete.map(term => term.id);
      await models.TermsCondition.destroy({
        where: { id: deleteIds },
      });
    }

    const existingTermsToUpdate = terms.filter(term => term.id !== null);
    const newTerms = terms.filter(term => term.id === null);

    // Update existing terms
    const updatePromises = existingTermsToUpdate.map(async (term) => {
      return models.TermsCondition.update(
        {
          term: term.term,
          description: term.description,
          ip_address,
          status,
        },
        { where: { id: term.id } }
      );
    });

    // Insert new terms
    const insertPromises = newTerms.map(async (term) => {
      return models.TermsCondition.create({
        documentType,
        userId,
        companyId,
        term: term.term,
        description: term.description,
        ip_address,
        status,
      });
    });

    await Promise.all([...updatePromises, ...insertPromises]);

    // Fetch the updated list of terms
    const updatedRecords = await models.TermsCondition.findAll({
      where: { companyId, documentType, userId },
    });

    return res.status(200).json({
      message: "Terms condition(s) updated successfully!",
      data: {
        documentType,
        userId,
        companyId,
        ip_address,
        status,
        terms: updatedRecords.map(record => ({
          id: record.id,
          term: record.term,
          description: record.description,
        })),
      },
    });

  } catch (error) {
    console.error("Error updating terms condition:", error);
    res.status(500).json({
      message: "Something went wrong while updating terms condition. Please try again later.",
      error: error.message,
    });
  }
}

async function deleteTermsCondition(req, res) {
  try {
    const { termsConditionId, companyId } = req.body;

    if (!termsConditionId || !companyId) {
      return res.status(400).json({ message: "Terms Condition ID and Company ID are required." });
    }

    const existingTerm = await models.TermsCondition.findOne({
      where: { id: termsConditionId, companyId },
    });

    if (!existingTerm) {
      return res.status(200).json({ message: "Terms condition not found for the given Company ID." });
    }

    await models.TermsCondition.destroy({
      where: { id: termsConditionId, companyId },
    });

    return res.status(200).json({
      message: "Terms condition deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting terms condition:", error);
    return res.status(500).json({
      message: "Something went wrong while deleting terms condition.",
      error: error.message,
      data: [],
    });
  }
}

async function getTermsCondition(req, res) {
  try {
    const { companyId } = req.body;

    if (!companyId) {
      return res.status(400).json({ message: "Company ID is required." });
    }

    const termsConditions = await models.TermsCondition.findAll({
      where: { companyId },
      attributes: ["id", "documentType", "term", "description", "userId", "ip_address", "status", "createdAt", "updatedAt"],
    });

    if (!termsConditions.length) {
      return res.status(200).json([]);
    }

    const groupedTerms = termsConditions.reduce((acc, term) => {
      if (!acc[term.documentType]) {
        acc[term.documentType] = { docType: term.documentType, termsData: [] };
      }
      acc[term.documentType].termsData.push({
        id: term.id,
        term: term.term,
        desc: term.description,
      });
      return acc;
    }, {});

    res.status(200).json(Object.values(groupedTerms));
  } catch (error) {
    console.error("Error fetching terms conditions:", error);
    res.status(500).json({ message: "Something went wrong.", error: error.message });
  }
}

module.exports = {
  addTermsCondition: addTermsCondition,
  getTermsCondition: getTermsCondition,
  editTermsCondition: editTermsCondition,
  deleteTermsCondition: deleteTermsCondition,
};
