"use strict";

const gameData = require("../../integrations/battleNet/game-data.client");
const cache = require("../../services/wow-json-cache.service");

async function getById(req, res, next) {
  const spellId = Number(req.params.id);
  if (!Number.isSafeInteger(spellId) || spellId <= 0) {
    return res.status(400).json({ success: false, error: {
      code: "INVALID_SPELL_ID", message: "El ID del hechizo debe ser un entero positivo."
    }});
  }
  try {
    const locale = req.query.locale || "es_ES";
    const result = await cache.getSpellOrFetch({
      spellId, locale, fetcher: () => gameData.getSpell(spellId, locale)
    });
    res.set("X-WoW-JSON-Cache", result.cache);
    return res.json({ success: true, data: {
      ...result.data, source: "blizzard", version: "retail",
      localIcon: result.assets?.[result.data.icon]?.url || null
    }});
  } catch (error) {
    const status = error.response?.status;
    console.error("WoW spell error:", status || "", error.response?.data || error.message);
    if (status === 404) {
      return res.status(404).json({ success: false, error: {
        code: "SPELL_NOT_FOUND", message: "No se encontró el hechizo en esta fuente de datos."
      }});
    }
    return next(error);
  }
}
module.exports = { getById };
