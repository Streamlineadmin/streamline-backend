'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class BOMAttachments extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      BOMAttachments.belongsTo(models.BOMDetails, {
        foreignKey: 'BOMID',
        targetKey: 'bomId',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
    }
  }
  BOMAttachments.init({
    BOMID: DataTypes.STRING,
    attachmentName: DataTypes.STRING,
    companyId: DataTypes.INTEGER,
    userId: DataTypes.INTEGER,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'BOMAttachments',
  });
  return BOMAttachments;
};