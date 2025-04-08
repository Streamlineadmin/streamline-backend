'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class BuyerSupplier extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  BuyerSupplier.init({
    name: DataTypes.STRING,
    companyId: DataTypes.INTEGER,
    email: DataTypes.STRING,
    phone: DataTypes.STRING,
    companyName: DataTypes.STRING,
    companyEmail: DataTypes.STRING,
    companyType: DataTypes.INTEGER,
    GSTNumber: DataTypes.STRING,
    GSTType: DataTypes.INTEGER,
    status: DataTypes.INTEGER,
    ip_address: DataTypes.STRING,
    PAN: DataTypes.STRING,
    customerType: {
      type: DataTypes.STRING,
      defaultValue: 'company',
    }

  }, {
    sequelize,
    modelName: 'BuyerSupplier',
  });
  return BuyerSupplier;
};