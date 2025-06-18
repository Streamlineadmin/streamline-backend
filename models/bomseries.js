'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class BOMSeries extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  BOMSeries.init({
    seriesName: DataTypes.STRING,
    prefix: DataTypes.STRING,
    number: DataTypes.INTEGER,
    companyId: DataTypes.INTEGER,
    userId: DataTypes.INTEGER,
    status: DataTypes.STRING,
    default: DataTypes.INTEGER,
    nextNumber: DataTypes.INTEGER,
    ip_address: DataTypes.STRING,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'BOMSeries',
  });
  return BOMSeries;
};