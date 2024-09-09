'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Items extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Items.init({
    itemName: DataTypes.STRING,
    itemType: DataTypes.INTEGER,
    category: DataTypes.INTEGER,
    metricsUnit: DataTypes.INTEGER,
    HSNCode: DataTypes.STRING,
    price: DataTypes.INTEGER,
    taxType: DataTypes.INTEGER,
    currentStock: DataTypes.INTEGER,
    minStock: DataTypes.INTEGER,
    maxStock: DataTypes.INTEGER,
    description: DataTypes.TEXT,
    companyId: DataTypes.INTEGER,
    itemId: DataTypes.INTEGER,
    status: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Items',
  });
  return Items;
};