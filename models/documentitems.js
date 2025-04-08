'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class DocumentItems extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  DocumentItems.init({
    documentNumber: DataTypes.STRING,
    companyId: DataTypes.INTEGER,
    itemId: DataTypes.STRING,
    itemName: DataTypes.STRING,
    HSN: DataTypes.STRING,
    UOM: DataTypes.STRING,
    quantity: DataTypes.INTEGER,
    price: DataTypes.INTEGER,
    discountOne: DataTypes.STRING,
    discountTwo: DataTypes.STRING,
    totalDiscount: DataTypes.STRING,
    taxType: DataTypes.STRING,
    tax: DataTypes.STRING,
    totalTax: DataTypes.STRING,
    totalBeforeTax: DataTypes.STRING,
    totalAfterTax: DataTypes.STRING,
    receivedToday: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'DocumentItems',
  });
  return DocumentItems;
};