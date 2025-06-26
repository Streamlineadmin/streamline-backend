"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class LogPayment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  LogPayment.init(
    {
      companyName: DataTypes.STRING,
      companyId: DataTypes.INTEGER,
      userId: DataTypes.INTEGER,
      documentType: DataTypes.STRING,
      documentNumber: DataTypes.STRING,
      createdAt: DataTypes.STRING,
      updatedAt: DataTypes.STRING,
      dueDate: DataTypes.STRING,
      amountPaid: DataTypes.DECIMAL(12, 2),
      logPayment: DataTypes.DECIMAL(12, 2),
      comments: DataTypes.STRING,
      markPaid: DataTypes.BOOLEAN,
      paymentDate: DataTypes.STRING,
      paymentMode: DataTypes.STRING,
      bankName: DataTypes.STRING,
      transactionNumber: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "LogPayment",
      timestamps: true,
    }
  );
  return LogPayment;
};
