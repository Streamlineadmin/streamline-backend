'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Users extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Users.hasMany(models.Documents, {
        foreignKey: 'createdBy'
      });
    }
  }
  Users.init({
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    username: DataTypes.STRING,
    companyName: DataTypes.STRING,
    companyId: DataTypes.STRING,
    contactNo: DataTypes.STRING,
    role: DataTypes.STRING,
    status: DataTypes.INTEGER,
    resetToken: DataTypes.STRING,  // Token for password reset
    resetTokenExpiry: DataTypes.DATE, // Expiry time for the reset token
    website: DataTypes.STRING,
    profileURL: DataTypes.STRING,
    businessType: DataTypes.STRING,
    pan: DataTypes.STRING,
    gstNumber: DataTypes.STRING,
    cin: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'Users',
  });
  return Users;
};