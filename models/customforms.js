'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CustomForms extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  CustomForms.init({
    formName: DataTypes.STRING,
    description: DataTypes.TEXT,
    companyId: DataTypes.INTEGER,
    userId: DataTypes.INTEGER,
    status: DataTypes.INTEGER,
    fields: {
      type: DataTypes.JSON,
      defaultValue: []
    }
  }, {
    sequelize,
    modelName: 'CustomForms',
  });
  return CustomForms;
};
