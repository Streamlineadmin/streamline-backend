'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ItemMapping extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
  }
  ItemMapping.init({
    companyId: DataTypes.INTEGER,
    items: DataTypes.JSON,
    companyName: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'ItemMapping',
  });
  return ItemMapping;
};