"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class EMailCredential extends Model {
        static associate(models) {
            // define association here if needed
            // Example: EMailCredential.belongsTo(models.Company, { foreignKey: 'companyId' });
        }
    }
    EMailCredential.init(
        {
            email: DataTypes.STRING,
            password: DataTypes.STRING,
            companyId: DataTypes.INTEGER,
            userId: DataTypes.INTEGER
        },
        {
            sequelize,
            modelName: "EMailCredential",
            timestamps: true,
        }
    );

    return EMailCredential;
};
