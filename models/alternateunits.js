'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class AlternateUnits extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  AlternateUnits.init({
    itemId: DataTypes.INTEGER,
    alternateUnits: DataTypes.INTEGER,
    conversionfactor: DataTypes.FLOAT,
    ip_address: DataTypes.STRING,
    status: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'AlternateUnits',
  });
  return AlternateUnits;
};