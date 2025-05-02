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
      Documents.belongsTo(models.LogisticDetails, {
        foreignKey: 'logisticDetailsId',
        as: 'logisticDetails',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
      Documents.belongsTo(models.Users, {
        foreignKey: 'createdBy',
        as: 'creator' // alias for cleaner querying
      });

      Documents.belongsTo(models.CompanyTermsCondition, {
        foreignKey: 'companyTermsConditionId',
        as: 'termsCondition',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
    }
  }

  Documents.init({
    documentType: DataTypes.STRING,
    documentNumber: DataTypes.STRING,
    buyerName: DataTypes.STRING,
    buyerBillingAddress: {
      type: DataTypes.JSON,
      allowNull: true
    },
    buyerDeliveryAddress: {
      type: DataTypes.JSON,
      allowNull: true
    },
    buyerContactNumber: DataTypes.STRING,
    buyerEmail: DataTypes.STRING,
    BuyerPANNumber: DataTypes.STRING,
    supplierName: DataTypes.STRING,
    supplierBillingAddress: {
      type: DataTypes.JSON,
      allowNull: true
    },
    supplierDeliverAddress: {
      type: DataTypes.JSON,
      allowNull: true
    },
    supplierContactNo: DataTypes.STRING,
    supplierEmail: DataTypes.STRING,
    documentDate: DataTypes.STRING,
    ammendment: DataTypes.STRING,
    deliveryDate: DataTypes.STRING,
    paymentTerm: DataTypes.STRING,
    store: DataTypes.STRING,
    rejectedStore: DataTypes.STRING,
    enquiryNumber: DataTypes.STRING,
    enquiryDate: DataTypes.STRING,
    logisticDetailsId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'LogisticDetails',
        key: 'id',
      },
    },
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
    quotationDate: DataTypes.STRING,
    quotationNumber: DataTypes.STRING,
    orderConfirmationNumber: DataTypes.STRING,
    orderConfirmationDate: DataTypes.STRING,
    purchaseOrderNumber: DataTypes.STRING,
    purchaseOrderDate: DataTypes.STRING,
    grn_number: DataTypes.STRING,
    grn_Date: DataTypes.STRING,
    performaInvoiceNumber: DataTypes.STRING,
    performaInvoiceDate: DataTypes.STRING,
    documentTo: DataTypes.STRING,
    isRounded: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    advancePayment: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.00,
    },
    GSTValue: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    buyerGSTNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    buyerSupplierKYCDetails: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    is_refered: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    companyTermsConditionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'CompanyTermsConditions',
        key: 'id'
      }
    },
    tcsData: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    addStockOn: DataTypes.STRING,
    purpose: DataTypes.STRING,
    requiredDate: DataTypes.STRING,
    requestedBy: DataTypes.STRING,
    department: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Documents',
  });

  return Documents;
};
