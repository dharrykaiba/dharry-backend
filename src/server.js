const config = require("./config/config");
const { sequelize } = require("./core/database");
const { createApp } = require("./app/app");
require("./models");

async function start() {
  await sequelize.authenticate();
  const app = createApp();
  const server = app.listen(config.server.port, () => {
    console.log("----------------------------------------");
    console.log("Dharry Backend - Central Multiproject");
    console.log("----------------------------------------");
    console.log(`Servidor: http://localhost:${config.server.port}`);
    console.log(`Health: http://localhost:${config.server.port}/health`);
    console.log(`Battle.net: http://localhost:${config.server.port}/api/auth/login/battle.net`);
    console.log(`WoW: http://localhost:${config.server.port}/api/wow/profile`);
    console.log("----------------------------------------");
  });

  const shutdown = async (signal) => {
    console.log(`${signal}: cerrando servidor...`);
    server.close(async () => { await sequelize.close(); process.exit(0); });
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

start().catch((error) => { console.error("No se pudo iniciar Dharry Backend:", error); process.exit(1); });
