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
        tcsapply: DataTypes.STRING
    }, {
        sequelize,
        modelName: 'Settings',
    });
    return Settings;
};