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
        productionId: DataTypes.STRING,
        documentNumber: DataTypes.STRING,
        bomId: DataTypes.INTEGER,
        productionEndDate: DataTypes.STRING,
        assignedTo: DataTypes.INTEGER,
        productionStartDate: DataTypes.STRING,
        productionCompletionDate: DataTypes.STRING,
        mto: DataTypes.INTEGER,
        createdBy: DataTypes.INTEGER,
        ip_address: DataTypes.STRING,
        status: DataTypes.INTEGER,
        parentProductionId: DataTypes.INTEGER,
        serviceOrderNumber: DataTypes.STRING,
        completedBy: DataTypes.INTEGER,
        isManual: DataTypes.JSON,
        isBulkProduction: DataTypes.BOOLEAN,
        bulkProductionId: DataTypes.INTEGER
    }, {
        sequelize,
        modelName: 'ProcessLogs',
        freezeTableName: true,
        tableName: 'ProcessLogs',
    });
    return ProcessLogs;
};