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
      // define association here
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
    resetTokenExpiry: DataTypes.DATE // Expiry time for the reset token
  }, {
    sequelize,
    modelName: 'Users',
  });
  return Users;
};