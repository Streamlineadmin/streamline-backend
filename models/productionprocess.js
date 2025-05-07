"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ProductionProcess extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Define associations here
      ProductionProcess.hasMany(models.BOMProductionProcess, {
        foreignKey: 'processId',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
    }
  }

  ProductionProcess.init(
    {
      processCode: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      processName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 1,
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "ProductionProcess",
      tableName: "ProductionProcess",
    }
  );

  return ProductionProcess;
};
