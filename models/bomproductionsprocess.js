"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class BOMProductionsProcess extends Model {
    static associate(models) {
      // If you want back-refs:
      this.belongsTo(models.BOMDetails, { foreignKey: 'bomId' });
      this.belongsTo(models.ProductionProcess, { foreignKey: 'processId' });
      // BOMProductionProcess.belongsTo(models.BOMDetails, {
      //   foreignKey: "bomId",
      //   targetKey: "bomId",
      //   onDelete: "CASCADE",
      //   onUpdate: "CASCADE",
      // });
      // BOMProductionProcess.belongsTo(models.ProductionProcess, {
      //   foreignKey: "processId",
      //   onDelete: "CASCADE",
      //   onUpdate: "CASCADE",
      // });
    }
  }

  BOMProductionsProcess.init(
    {
      bomId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      processId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      sequence: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      companyId: DataTypes.INTEGER,
      userId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "BOMProductionProcess",
      timestamps: true,
    }
  );

  return BOMProductionsProcess;
};
