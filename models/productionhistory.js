'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class ProductionHistory extends Model {
        static associate(models) {
        }
    }
    ProductionHistory.init({
        productionId: DataTypes.INTEGER,
        actionType: DataTypes.STRING,
        summary: DataTypes.JSON
    }, {
        sequelize,
        modelName: 'ProductionHistory',
    });
    return ProductionHistory;
};