'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class RolePermissions extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  RolePermissions.init({
    role: DataTypes.STRING,
    companyId: DataTypes.INTEGER,
    permission: DataTypes.STRING,
    subpermission: DataTypes.STRING,
    create: DataTypes.INTEGER,
    edit: DataTypes.INTEGER,
    delete: DataTypes.INTEGER,
    view: DataTypes.INTEGER,
    ip_address: DataTypes.STRING,
    status: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'RolePermissions',
  });
  return RolePermissions;
};