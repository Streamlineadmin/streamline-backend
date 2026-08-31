'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class BOMApproval extends Model {
    static associate(models) {
    }
  }
  BOMApproval.init(
    {
      approvalId: DataTypes.STRING,
      bomId: DataTypes.STRING,
      bomDetailId: DataTypes.INTEGER,
      bomName: DataTypes.STRING,
      approvalStatus: {
        type: DataTypes.STRING,
        defaultValue: 'Pending',
      },
      requestedBy: DataTypes.INTEGER,
      companyId: DataTypes.INTEGER,
      approvedBy: DataTypes.INTEGER,
      approvalDate: DataTypes.DATE,
      comment: DataTypes.TEXT,
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
    },
    {
      sequelize,
      modelName: "BOMApproval",
      tableName: "BOMApprovals",
      timestamps: true,
    }
  );
  return BOMApproval;
};
