'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ProductionFinishedGoods extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
  }
  ProductionFinishedGoods.init({
    productionId: DataTypes.INTEGER,
    itemId: DataTypes.STRING,
    itemName: DataTypes.STRING,
    uom: DataTypes.STRING,
    quantity: DataTypes.FLOAT,
    store: DataTypes.STRING,
    costAllocation: DataTypes.FLOAT,
    status: DataTypes.INTEGER,
    producedQuantity: DataTypes.FLOAT,
    rejectQuantity: DataTypes.FLOAT,
    passedQuantity: DataTypes.FLOAT,
    quantityToTest: DataTypes.FLOAT
  }, {
    sequelize,
    modelName: 'ProductionFinishedGoods',
  });
  return ProductionFinishedGoods;
};