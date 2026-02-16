const models = require("../models");

async function addColumns(req, res) {
    const transaction = await models.sequelize.transaction();

    try {
        const { companyId, hideFields, documentType } = req.body;

        await models.ShowHideColumns.destroy({
            where: { companyId, documentType },
            transaction
        });

        await models.ShowHideColumns.create(
            {
                companyId,
                documentType,
                hideFields
            },
            { transaction }
        );

        await transaction.commit();

        return res.status(201).json({
            message: "Data Created successfully",
        });

    } catch (error) {
        await transaction.rollback();

        return res.status(500).json({
            message: "Something went wrong, please try again later!",
            error
        });
    }
}

async function getAllColumns(req, res) {

    try {
        const { companyId } = req.body;

        const data = await models.ShowHideColumns.findAll({
            where: { companyId },
            raw: true,
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({
            message: "Data fetched successfully",
            data
        });

    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong",
            error
        });
    }
}

async function deleteColumns(req, res) {

    try {
        const { id } = req.body;

        await models.ShowHideColumns.destroy({
            where: { id }
        });

        return res.status(200).json({
            message: "Data deleted successfully"
        });

    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong",
            error
        });
    }
}

async function editColumns(req, res) {
    try {
        const { id, hideFields } = req.body;

        await models.ShowHideColumns.update(
            { hideFields },
            {
                where: { id }
            }
        );

        return res.status(200).json({
            message: "Data updated successfully"
        });

    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong",
            error
        });
    }
}

module.exports = {
    addColumns,
    getAllColumns,
    deleteColumns,
    editColumns
}