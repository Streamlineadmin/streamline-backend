'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CustomerQuery extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  CustomerQuery.init({
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    query: DataTypes.STRING,
    ip_address: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'CustomerQuery',
  });
  return CustomerQuery;
};