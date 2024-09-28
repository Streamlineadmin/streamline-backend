'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Documents extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Documents.init({
    documentType: DataTypes.STRING,
    documentNumber: DataTypes.STRING,
    buyerName: DataTypes.STRING,
    buyerBillingAddress: DataTypes.STRING,
    buyerDeliveryAddress: DataTypes.STRING,
    buyerContactNumber: DataTypes.STRING,
    buyerEmail: DataTypes.STRING,
    supplierName: DataTypes.STRING,
    supplierBillingAddress: DataTypes.STRING,
    supplierDeliverAddress: DataTypes.STRING,
    supplierContactNo: DataTypes.STRING,
    supplierEmail: DataTypes.STRING,
    documentDate: DataTypes.STRING,
    ammendment: DataTypes.STRING,
    deliveryDate: DataTypes.STRING,
    paymentTerm: DataTypes.STRING,
    store: DataTypes.STRING,
    enquiryNumber: DataTypes.STRING,
    enquiryDate: DataTypes.STRING,
    logisticDetails: DataTypes.TEXT,
    additionalDetails: DataTypes.TEXT,
    signature: DataTypes.STRING,
    companyId: DataTypes.INTEGER,
    createdBy: DataTypes.INTEGER,
    status: DataTypes.INTEGER,
    ip_address: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Documents',
  });
  return Documents;
};