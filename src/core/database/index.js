const { Sequelize } = require("sequelize");
const config = require("../../config/config");

const sequelize = new Sequelize(config.database.url, {
  dialect: "postgres",
  logging: config.database.logging ? console.log : false,
  dialectOptions:
    config.nodeEnv === "production" && process.env.DATABASE_SSL === "true"
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : {}
});

async function testConnection() {
  await sequelize.authenticate();
}

module.exports = { sequelize, testConnection };
