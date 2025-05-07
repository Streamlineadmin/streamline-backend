"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class BOMDetails extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      BOMDetails.hasMany(models.BOMAttachments, {
        foreignKey: 'BOMID',
        sourceKey: 'bomId',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
      // define association here
      BOMDetails.hasMany(models.BOMProductionProcess, {
        foreignKey: 'bomId',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
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
