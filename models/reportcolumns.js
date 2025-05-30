"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ReportColumns extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here, if needed
      // Example: ReportColumns.belongsTo(models.User, { foreignKey: 'userId' });
    }
  }

  ReportColumns.init(
    {
      columnsData: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      ip_address: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      documentType: {
        type: DataTypes.STRING,
        allowNull: true,
      }
    },
    {
      sequelize,
      modelName: "ReportColumns",
      tableName: "ReportColumns",
      timestamps: true,
    }
  );

  return ReportColumns;
};
