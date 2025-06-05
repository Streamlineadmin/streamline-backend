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
      DocumentItems.belongsTo(models.Items, {
        foreignKey: 'itemId',
        targetKey: 'itemId',
        as: 'itemDetails'
      });
    }
  }
  DocumentItems.init({
    documentNumber: DataTypes.STRING,
    companyId: DataTypes.INTEGER,
    itemId: DataTypes.STRING,
    itemName: DataTypes.STRING,
    HSN: DataTypes.STRING,
    UOM: DataTypes.STRING,
    quantity: DataTypes.FLOAT,
    price: DataTypes.INTEGER,
    discountOne: DataTypes.STRING,
    discountTwo: DataTypes.STRING,
    totalDiscount: DataTypes.STRING,
    taxType: DataTypes.STRING,
    tax: DataTypes.STRING,
    totalTax: DataTypes.STRING,
    totalBeforeTax: DataTypes.STRING,
    totalAfterTax: DataTypes.STRING,
    receivedToday: DataTypes.FLOAT,
    pendingQuantity: DataTypes.FLOAT,
    receivedQuantity: DataTypes.FLOAT,
    auQuantity: DataTypes.FLOAT,
    alternateUnit: DataTypes.STRING,
    conversionFactor: DataTypes.FLOAT,
    ServiceID: DataTypes.STRING,
    ServiceName: DataTypes.STRING,
    additionalDetails: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'DocumentItems',
  });
  return DocumentItems;
};