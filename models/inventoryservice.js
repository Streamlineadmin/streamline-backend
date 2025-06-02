"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class InventoryServices extends Model {
    static associate(models) {
      // define association here if needed
      // Example: InventoryServices.belongsTo(models.Company, { foreignKey: 'companyId' });
    }
  }

  InventoryServices.init(
    {
      serviceId: {
        type: DataTypes.STRING,
      },
      serviceName: {
        type: DataTypes.STRING,
      },
      category: {
        type: DataTypes.INTEGER,
      },
      subCategory: {
        type: DataTypes.INTEGER,
      },
      microCategory: {
        type: DataTypes.INTEGER,
      },
      alternateUnit: {
        type: DataTypes.INTEGER,
      },
      conversionFactor: {
        type: DataTypes.FLOAT,
      },
      metricsUnit: {
        type: DataTypes.INTEGER,
      },
      HSNCode: {
        type: DataTypes.STRING,
      },
      price: {
        type: DataTypes.FLOAT,
      },
      taxType: {
        type: DataTypes.INTEGER,
      },
      tax: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
      },
      companyId: {
        type: DataTypes.INTEGER,
      },
      status: {
        type: DataTypes.INTEGER,
      },
    },
    {
      sequelize,
      modelName: "InventoryServices",
      tableName: "InventoryServices",
      timestamps: true,
    }
  );

  return InventoryServices;
};
