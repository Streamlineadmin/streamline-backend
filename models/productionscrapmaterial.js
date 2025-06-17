'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ProductionScrapMaterials extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
  }
  ProductionScrapMaterials.init({
    productionId: DataTypes.INTEGER,
    itemId: DataTypes.STRING,
    itemName: DataTypes.STRING,
    uom: DataTypes.STRING,
    quantity: DataTypes.FLOAT,
    producedQuantity: DataTypes.FLOAT,
    store: DataTypes.STRING,
    costAllocationPercent: DataTypes.FLOAT,
    status: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'ProductionScrapMaterials',
  });
  return ProductionScrapMaterials;
};