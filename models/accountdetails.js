'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class AccountDetails extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  AccountDetails.init({
    bankName: DataTypes.STRING,
    accountHolderName: DataTypes.STRING,
    accountNumber: DataTypes.INTEGER,
    branch: DataTypes.STRING,
    swiftCode: DataTypes.STRING,
    IFSCCode: DataTypes.STRING,
    MICRCode: DataTypes.STRING,
    address: DataTypes.STRING,
    companyId: DataTypes.INTEGER,
    addedBy: DataTypes.INTEGER,
    status: DataTypes.INTEGER,
    ip_address: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'AccountDetails',
  });
  return AccountDetails;
};