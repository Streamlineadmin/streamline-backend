"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class BOMDetails extends Model {
    static associate(models) {
      BOMDetails.hasMany(models.BOMAttachments, {
        foreignKey: "BOMID",
        sourceKey: "bomId",
        as: "attachments",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      BOMDetails.hasMany(models.BOMProductionProcess, {
        foreignKey: "bomId",
        as: "BOMProductionProcesses",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      BOMDetails.hasMany(models.BOMFinishedGoods, {
        foreignKey: "bomId",
        as: "finishedGoods",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      BOMDetails.hasMany(models.BOMRawMaterial, {
        foreignKey: "bomId",
        as: "rawMaterials",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      BOMDetails.hasMany(models.BOMScrapMaterial, {
        foreignKey: "bomId",
        as: "scrapMaterials",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      BOMDetails.hasMany(models.BOMAdditionalCharges, {
        foreignKey: "bomId",
        as: "additionalCharges",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
    }
  }

  BOMDetails.init(
    {
      bomId: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      bomName: DataTypes.STRING,
      status: DataTypes.STRING,
      bomDescription: DataTypes.STRING,
      companyId: DataTypes.INTEGER,
      userId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "BOMDetails",
      timestamps: true,
    }
  );

  return BOMDetails;
};
