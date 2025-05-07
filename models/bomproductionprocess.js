"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class BOMProductionProcess extends Model {
    static associate(models) {
      // If you want back-refs:
      BOMProductionProcess.belongsTo(models.BOMDetails, {
        foreignKey: "bomId",
        targetKey: "bomId",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
      BOMProductionProcess.belongsTo(models.ProductionProcess, {
        foreignKey: "processId",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
    }
  }

  BOMProductionProcess.init(
    {
      bomId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: "BOMDetails",   // table name
          key: "bomId",          // business key
        },
        onDelete: "CASCADE",
      },
      processId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "ProductionProcess",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      sequence: {
        type: DataTypes.INTEGER,
        allowNull: true,       // optional, only if you need ordering
      },
    },
    {
      sequelize,
      modelName: "BOMProductionProcess",
      tableName: "BOMProductionProcess",
      timestamps: true,
    }
  );

  return BOMProductionProcess;
};
