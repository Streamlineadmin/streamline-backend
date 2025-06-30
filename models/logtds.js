'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class logTDS extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  logTDS.init({
    companyName: DataTypes.STRING,
    companyId: DataTypes.INTEGER,
    userId: DataTypes.INTEGER,
    documentType: DataTypes.STRING,
    documentNumber: DataTypes.STRING,
    tdsPercent: DataTypes.FLOAT,
    tdsAmount: DataTypes.FLOAT,
    totalAmountAfterDeduction: DataTypes.FLOAT,
    createdAt: DataTypes.STRING,
    updatedAt: DataTypes.STRING,
    comments: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'logTDS',
  });
  return logTDS;
};