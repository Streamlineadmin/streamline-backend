'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Store extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Store.init({
    name: DataTypes.STRING,
    companyId: DataTypes.INTEGER,
    addressLineOne: DataTypes.STRING,
    addressLineTwo: DataTypes.STRING,
    pincode: DataTypes.STRING,
    city: DataTypes.STRING,
    state: DataTypes.STRING,
    country: DataTypes.STRING,
    storeType: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Store',
  });
  return Store;
};