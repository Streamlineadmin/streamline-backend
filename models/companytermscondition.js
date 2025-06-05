'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CompanyTermsCondition extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      CompanyTermsCondition.hasMany(models.Documents, {
        foreignKey: 'companyTermsConditionId',
        as: 'documents',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
    }
  }
  CompanyTermsCondition.init({
    companyId: DataTypes.INTEGER,
    documentNumber: DataTypes.STRING,
    termsCondition: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    status: DataTypes.INTEGER,
    ip_address: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'CompanyTermsCondition',
  });
  return CompanyTermsCondition;
};