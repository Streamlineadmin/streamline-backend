"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class GateEntry extends Model {
        static associate(models) {
            // define association here if needed
            // Example: GateEntry.belongsTo(models.Company, { foreignKey: 'companyId' });
        }
    }
    GateEntry.init(
        {
            userId: DataTypes.INTEGER,
            documentNumber: DataTypes.STRING,
            vistorName: DataTypes.STRING,
            visitorContact: DataTypes.STRING,
            visitorEmail: DataTypes.STRING,
            visitorCompany: DataTypes.STRING,
            idProofType: DataTypes.STRING,
            idProofNumber: DataTypes.STRING,
            purposeOfVisit: DataTypes.STRING,
            visitorImageUrl: DataTypes.STRING,
            personToMeet: DataTypes.STRING,
            vehicleNumber: DataTypes.STRING,
            vehicleType: DataTypes.STRING,
            comments: DataTypes.STRING,
            companyId: DataTypes.INTEGER,
            status: DataTypes.INTEGER,
            securitySignatureUrl: DataTypes.STRING,
        },
        {
            sequelize,
            modelName: "GateEntry",
            timestamps: true,
        }
    );

    return GateEntry;
};
