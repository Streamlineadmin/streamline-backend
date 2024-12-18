'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TermsCondition extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  TermsCondition.init({
    documentType: DataTypes.STRING,
    term: DataTypes.STRING,
    description: DataTypes.STRING,
    companyId: DataTypes.INTEGER,
    userId: DataTypes.INTEGER,
    ip_address: DataTypes.STRING,
    status: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'TermsCondition',
  });
  return TermsCondition;
};