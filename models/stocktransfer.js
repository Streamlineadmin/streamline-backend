'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class StockTransfer extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  StockTransfer.init({
    transferNumber: DataTypes.INTEGER,
    fromStoreId: DataTypes.INTEGER,
    toStoreId: DataTypes.INTEGER,
    transferDate: DataTypes.STRING,
    transferredBy: DataTypes.INTEGER,
    status: DataTypes.INTEGER,
    itemId: DataTypes.INTEGER, // New column
    quantity: DataTypes.INTEGER, // New column
    companyId: DataTypes.INTEGER,
    comment: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    price: DataTypes.FLOAT,
    documentNumber: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'StockTransfer',
  });
  
  return StockTransfer;
};