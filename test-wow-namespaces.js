const gameData = require("./src/integrations/battleNet/game-data.client");

async function main() {
  try {
    const results = await gameData.testSpellNamespaces(133);
    console.dir(results, { depth: null });
  } catch (error) {
    console.error("Error ejecutando la prueba:", error.message);
    process.exitCode = 1;
  }
}

main();