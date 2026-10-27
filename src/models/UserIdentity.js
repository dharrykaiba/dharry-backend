const { DataTypes } = require("sequelize");
const { sequelize } = require("../core/database");

module.exports = sequelize.define("UserIdentity", {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  userId: { type: DataTypes.UUID, allowNull: false, field: "user_id" },
  provider: { type: DataTypes.STRING(50), allowNull: false },
  providerUserId: { type: DataTypes.STRING(255), allowNull: false, field: "provider_user_id" },
  providerEmail: { type: DataTypes.STRING(320), allowNull: true, field: "provider_email" },
  metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} }
}, { tableName: "user_identities", underscored: true, indexes: [{ unique: true, fields: ["provider", "provider_user_id"] }] });
