'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class DocumentTemplates extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Define association: One DocumentTemplate can be associated with multiple Documents
      DocumentTemplates.hasMany(models.Documents, {
        foreignKey: 'documentTemplateId',
        as: 'documents',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
    }
  }
  DocumentTemplates.init({
    template: DataTypes.TEXT,
    ip_address: DataTypes.STRING,
    status: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'DocumentTemplates',
  });
  return DocumentTemplates;
};