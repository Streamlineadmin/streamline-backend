'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class ProcessLogs extends Model {
        static associate(models) {
        }
    }
    ProcessLogs.init({
        companyId: DataTypes.INTEGER,
        productionId: DataTypes.INTEGER,
        processId: DataTypes.INTEGER,
        quantity: DataTypes.INTEGER,
        userId: DataTypes.INTEGER
    }, {
        sequelize,
        modelName: 'ProcessLogs',
        freezeTableName: true,
        tableName: 'ProcessLogs',
    });
    return ProcessLogs;
};