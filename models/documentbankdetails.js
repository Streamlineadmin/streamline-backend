'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class DocumentBankDetails extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  DocumentBankDetails.init({
    documentNumber: DataTypes.STRING,
    bankName: DataTypes.STRING,
    accountName: DataTypes.STRING,
    accountNumber: DataTypes.STRING,
    branch: DataTypes.STRING,
    IFSCCode: DataTypes.STRING,
    MICRCode: DataTypes.STRING,
    address: DataTypes.STRING,
    SWIFTCode: DataTypes.STRING,
    status: DataTypes.INTEGER,
    ip_address: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'DocumentBankDetails',
  });
  return DocumentBankDetails;
};