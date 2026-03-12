'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Settings extends Model {
        static associate(models) {
        }
    }
    Settings.init({
        addStockOn: DataTypes.STRING,
        companyId: DataTypes.INTEGER,
        stockReduceOnIV: DataTypes.STRING,
        stockReduceOnDC: DataTypes.STRING,
        tcsapply: DataTypes.STRING,
        stockTransfer: DataTypes.STRING,
        stockUpdate: DataTypes.STRING,
        stockReconcilation: DataTypes.STRING,
        purchaseDocument: DataTypes.STRING,
        salesDocument: DataTypes.STRING,
        serviceDocument: DataTypes.STRING,
        productionFinishedGood: DataTypes.STRING,
        productionRawMaterial: DataTypes.STRING,
        productionScrapMaterial: DataTypes.STRING,
        fetchCategoryOnCustomFields: DataTypes.STRING,
        template: {
            type: DataTypes.STRING,
            defaultValue: 'default'
        },
        poMandatory: DataTypes.BOOLEAN,
        poExactQuantity: DataTypes.BOOLEAN,
        addStockOnPurchaseInvoice: DataTypes.STRING,
        printFontSize: DataTypes.INTEGER,
        storeInItemLevel: DataTypes.BOOLEAN,
        orderExactQuantityChallan: DataTypes.BOOLEAN,
        categoryWiseCustomFields: DataTypes.BOOLEAN,
        itemInBarcodeSettings: DataTypes.JSON,
        itemOutBarcodeSettings: DataTypes.JSON,
    }, {
        sequelize,
        modelName: 'Settings',
    });
    return Settings;
};