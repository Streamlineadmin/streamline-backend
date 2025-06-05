'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class DocumentSeries extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  DocumentSeries.init({
    DocType: DataTypes.STRING,
    seriesName: DataTypes.STRING,
    prefix: DataTypes.STRING,
    number: DataTypes.INTEGER,
    companyId: DataTypes.INTEGER,
    status: DataTypes.INTEGER,
    default: DataTypes.INTEGER,
    nextNumber: DataTypes.INTEGER,
    ip_address: DataTypes.STRING,
    createdBy: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'DocumentSeries',
  });
  return DocumentSeries;
};