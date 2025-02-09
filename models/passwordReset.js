module.exports = (sequelize, DataTypes) => {
    const PasswordReset = sequelize.define(
      "PasswordReset",
      {
        email: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        token: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        expires_at: {
          type: DataTypes.DATE,
          allowNull: false,
        },
      },
      {
        timestamps: true,
      }
    );
  
    return PasswordReset;
  };
  