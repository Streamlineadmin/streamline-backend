'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class StoreItems extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  StoreItems.init({
    storeId: DataTypes.INTEGER,
    itemId: DataTypes.INTEGER,
    quantity: DataTypes.FLOAT,
    status: DataTypes.INTEGER,
    addedBy: DataTypes.INTEGER,
    price: DataTypes.FLOAT,
    isRejected: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'StoreItems',
  });
  return StoreItems;
};