'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class ProductionItems extends Model {
        static associate(models) {
        }
    }
    ProductionItems.init({
        productionId: DataTypes.INTEGER,
        documentNumber: DataTypes.STRING,
        itemId: DataTypes.STRING,
        itemName: DataTypes.STRING,
        UOM: DataTypes.STRING,
        quantity: DataTypes.FLOAT,
        ip_address: DataTypes.STRING,
        status: DataTypes.INTEGER
    }, {
        sequelize,
        modelName: 'ProductionItems',
    });
    return ProductionItems;
};