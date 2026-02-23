'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ShowHideColumns extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  ShowHideColumns.init({
    companyId: DataTypes.INTEGER,
    documentType: DataTypes.STRING,
    hideFields: DataTypes.JSON
  }, {
    sequelize,
    modelName: 'ShowHideColumns',
  });

  return ShowHideColumns;
};