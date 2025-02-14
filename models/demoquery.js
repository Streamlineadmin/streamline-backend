'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class DemoQuery extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  DemoQuery.init({
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    phone: DataTypes.STRING,
    companyName: DataTypes.STRING,
    companyWebsite: DataTypes.STRING,
    industry: DataTypes.STRING,
    companySize: DataTypes.STRING,
    currentERP: DataTypes.STRING,
    modules: DataTypes.STRING,
    query: DataTypes.STRING,
    source: DataTypes.STRING,
    ip_address: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'DemoQuery',
  });
  return DemoQuery;
};