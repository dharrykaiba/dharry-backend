const { DataTypes } = require("sequelize");
const crypto = require("crypto");

module.exports = {
  async up(queryInterface) {
    await queryInterface.createTable("users", {
      id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
      display_name: { type: DataTypes.STRING(120), allowNull: true },
      email: { type: DataTypes.STRING(320), allowNull: true },
      email_verified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: "active" },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      last_login_at: { type: DataTypes.DATE, allowNull: true }
    });

    await queryInterface.createTable("user_identities", {
      id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
      user_id: { type: DataTypes.UUID, allowNull: false, references: { model: "users", key: "id" }, onUpdate: "CASCADE", onDelete: "CASCADE" },
      provider: { type: DataTypes.STRING(50), allowNull: false },
      provider_user_id: { type: DataTypes.STRING(255), allowNull: false },
      provider_email: { type: DataTypes.STRING(320), allowNull: true },
      metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
    });
    await queryInterface.addConstraint("user_identities", { fields: ["provider", "provider_user_id"], type: "unique", name: "uq_user_identities_provider_user" });
    await queryInterface.addIndex("user_identities", ["user_id"]);

    await queryInterface.createTable("projects", {
      id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
      key: { type: DataTypes.STRING(80), allowNull: false, unique: true },
      name: { type: DataTypes.STRING(120), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: "active" },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
    });

    await queryInterface.createTable("user_projects", {
      id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
      user_id: { type: DataTypes.UUID, allowNull: false, references: { model: "users", key: "id" }, onUpdate: "CASCADE", onDelete: "CASCADE" },
      project_id: { type: DataTypes.UUID, allowNull: false, references: { model: "projects", key: "id" }, onUpdate: "CASCADE", onDelete: "CASCADE" },
      role: { type: DataTypes.STRING(50), allowNull: false, defaultValue: "user" },
      status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: "active" },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
    });
    await queryInterface.addConstraint("user_projects", { fields: ["user_id", "project_id"], type: "unique", name: "uq_user_projects_user_project" });
    await queryInterface.addIndex("user_projects", ["user_id"]);
    await queryInterface.addIndex("user_projects", ["project_id"]);

    await queryInterface.bulkInsert("projects", [
      { id: crypto.randomUUID(), key: "dharrystats", name: "DharryStats", description: "World of Warcraft statistics and tools", status: "active", created_at: new Date(), updated_at: new Date() },
      { id: crypto.randomUUID(), key: "dieseldharry", name: "DieselDharry", description: "DieselDharry project", status: "active", created_at: new Date(), updated_at: new Date() },
      { id: crypto.randomUUID(), key: "dharrynet", name: "DharryNet", description: "DharryNet project", status: "active", created_at: new Date(), updated_at: new Date() }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("user_projects");
    await queryInterface.dropTable("user_identities");
    await queryInterface.dropTable("projects");
    await queryInterface.dropTable("users");
  }
};
