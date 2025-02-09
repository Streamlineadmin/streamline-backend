'use strict';
const { Model } = require('sequelize');
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
    ip_address: DataTypes.STRING,

    // Newly added fields
    paymentDate: DataTypes.DATE,
    POCName: DataTypes.STRING,
    POCNumber: DataTypes.STRING,
    POCDate: DataTypes.DATE,
    OCNumber: DataTypes.STRING,
    OCDate: DataTypes.DATE,
    transporterName: DataTypes.STRING,
    TGNumber: DataTypes.STRING,
    TDNumber: DataTypes.STRING,
    TDDate: DataTypes.DATE,
    VehicleNumber: DataTypes.STRING,
    replyDate: DataTypes.DATE,
    Attention: DataTypes.STRING,
    invoiceNumber: DataTypes.STRING,
    invoiceDate: DataTypes.DATE,
    billDate: DataTypes.DATE,
    returnRecieveDate: DataTypes.DATE,
    creditNoteNumber: DataTypes.STRING,
    creditNotedate: DataTypes.DATE,
    indent_number: DataTypes.STRING,
    indent_date: DataTypes.STRING,
    supplier_invoice_number: DataTypes.STRING,
    supplier_invoice_date: DataTypes.STRING,
    challan_number: DataTypes.STRING,
    challan_date: DataTypes.STRING,
    inspection_date: DataTypes.STRING,
    pay_to_transporter: DataTypes.STRING,
    debit_note_number: DataTypes.STRING,
    debit_note_date: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'Documents',
  });

  return Documents;
};
