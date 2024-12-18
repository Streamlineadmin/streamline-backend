'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Transporters extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Transporters.init({
    GSTNumber: DataTypes.STRING,
    name: DataTypes.STRING,
    companyId: DataTypes.INTEGER,
    userId: DataTypes.INTEGER,
    ip_address: DataTypes.STRING,
    status: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Transporters',
  });
  return Transporters;
};