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
      ProductionProcess.belongsTo(models.BOMDetails, {
        foreignKey: 'bomId',
        targetKey: 'id',
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
      plannedTime: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      cost: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      bomId: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
      sequelize,
      modelName: "ProductionProcess",
      tableName: "ProductionProcess",
      indexes: [
      {
        unique: true,
        fields: ['processCode', 'companyId'],
      },
    ],
    }
  );

  return ProductionProcess;
};
