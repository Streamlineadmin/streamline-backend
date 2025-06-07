"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class BOMProductionProcess  extends Model {
    static associate(models) {
      // If you want back-refs:
      this.belongsTo(models.BOMDetails, { foreignKey: 'bomId' });
      this.belongsTo(models.ProductionProcess, { foreignKey: 'processId' });
      BOMProductionProcess.belongsTo(models.BOMDetails, {
        foreignKey: "bomId",
        targetKey: "id",
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
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      processId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      companyId: DataTypes.INTEGER,
      userId: DataTypes.INTEGER,
      status: DataTypes.STRING,
    },
    {
      sequelize,
      tableName: "BOMProductionsProcesses", 
      modelName: "BOMProductionProcess",
      timestamps: true,
    }
  );

  return BOMProductionProcess;
};
