'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class BulkProduction extends Model {
        static associate(models) {
        }
    }
    BulkProduction.init({
        productionId: DataTypes.STRING,
        companyId: DataTypes.INTEGER,
        status: DataTypes.INTEGER
    }, {
        sequelize,
        modelName: 'BulkProduction',
        freezeTableName: true,
        tableName: 'BulkProduction',
    });
    return BulkProduction;
};