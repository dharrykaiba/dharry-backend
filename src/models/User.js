const { DataTypes } = require("sequelize");
const { sequelize } = require("../core/database");

module.exports = sequelize.define("User", {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  displayName: { type: DataTypes.STRING(120), allowNull: true, field: "display_name" },
  email: { type: DataTypes.STRING(320), allowNull: true },
  emailVerified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "email_verified" },
  status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: "active" },
  lastLoginAt: { type: DataTypes.DATE, allowNull: true, field: "last_login_at" }
}, { tableName: "users", underscored: true });
