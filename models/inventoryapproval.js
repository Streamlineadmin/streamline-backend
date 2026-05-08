"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class InventoryApproval extends Model {
        static associate(models) {
            // define association here if needed
            // Example: InventoryApproval.belongsTo(models.Company, { foreignKey: 'companyId' });
        }
    }
    InventoryApproval.init(
        {
            approvalId: DataTypes.STRING,
            documentType: DataTypes.STRING,
            documentNumber: DataTypes.STRING,
            approvalStatus: DataTypes.STRING,
            requestedBy: DataTypes.INTEGER,
            companyId: DataTypes.INTEGER,
            status: DataTypes.INTEGER,
            approvedBy: DataTypes.INTEGER,
            approvalDate: DataTypes.DATE,
            batchesAssigned: DataTypes.BOOLEAN,
            comment: DataTypes.STRING,
        },
        {
            sequelize,
            modelName: "InventoryApproval",
            timestamps: true,
        }
    );

    return InventoryApproval;
};
