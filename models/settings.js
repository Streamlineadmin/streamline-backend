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
        fetchCategoryOnCustomFields: DataTypes.STRING
    }, {
        sequelize,
        modelName: 'Settings',
    });
    return Settings;
};