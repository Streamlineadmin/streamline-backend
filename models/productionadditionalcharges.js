'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class ProductionAdditionalCharges extends Model {
        static associate(models) {
        }
    }
    ProductionAdditionalCharges.init({
        productionId: DataTypes.INTEGER,
        chargesName: DataTypes.STRING,
        amount: DataTypes.FLOAT,
        status: DataTypes.INTEGER,
        averageCost: DataTypes.FLOAT,
        currentaverageCost: DataTypes.FLOAT,
        totalCost: DataTypes.FLOAT,
        currentCost: DataTypes.FLOAT,
    }, {
        sequelize,
        modelName: 'ProductionAdditionalCharges',
    });
    return ProductionAdditionalCharges;
};