const { sequelize } = require("./index");
const { bootstrapProjects } = require("../projects/project.service");

async function bootstrapDatabase() {
  await sequelize.authenticate();
  await bootstrapProjects();
}

module.exports = { bootstrapDatabase };
