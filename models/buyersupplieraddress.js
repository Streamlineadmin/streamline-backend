'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class BuyerSupplierAddress extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  BuyerSupplierAddress.init({
    buyerSupplierId: DataTypes.INTEGER,
    addressLineOne: DataTypes.STRING,
    addressLineTwo: DataTypes.STRING,
    addressType: DataTypes.INTEGER,
    city: DataTypes.STRING,
    state: DataTypes.STRING,
    country: DataTypes.STRING,
    pincode: DataTypes.STRING,
    status: DataTypes.INTEGER,
    ip_address: DataTypes.STRING,
    default: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'BuyerSupplierAddress',
  });
  return BuyerSupplierAddress;
};