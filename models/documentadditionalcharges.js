'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class DocumentAdditionalCharges extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  DocumentAdditionalCharges.init({
    documentNumber: DataTypes.STRING,
    chargingFor: DataTypes.STRING,
    price: DataTypes.FLOAT,
    tax: DataTypes.FLOAT,
    total: DataTypes.FLOAT,
    status: DataTypes.INTEGER,
    ip_address: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'DocumentAdditionalCharges',
  });
  return DocumentAdditionalCharges;
};