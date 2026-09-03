'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class BOMApprovalPermission extends Model {
    static associate(models) {
    }
  }
  BOMApprovalPermission.init(
    {
      companyId: DataTypes.INTEGER,
      userId: DataTypes.INTEGER,
      permissions: DataTypes.JSON,
      canApprove: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: "BOMApprovalPermission",
      tableName: "BOMApprovalPermissions",
      timestamps: true,
    }
  );
  return BOMApprovalPermission;
};
