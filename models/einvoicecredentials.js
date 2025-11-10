"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class EInvoiceCredntial extends Model {
        static associate(models) {
            // define association here if needed
            // Example: EInvoiceCredntial.belongsTo(models.Company, { foreignKey: 'companyId' });
        }
    }
    EInvoiceCredntial.init(
        {
            userName:DataTypes.STRING,
            password: DataTypes.STRING,
            companyId: DataTypes.INTEGER
        },
        {
            sequelize,
            modelName: "EInvoiceCredntial",
            timestamps: true,
        }
    );

    return EInvoiceCredntial;
};
