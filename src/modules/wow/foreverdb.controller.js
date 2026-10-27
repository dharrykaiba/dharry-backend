//src/modules/wow/foreverdb.controller.js

"use strict";

const foreverDb = require("../../integrations/foreverdb/foreverdb.client");
const cache = require("../../services/wow-json-cache.service");

const ALLOWED_RESOURCES = new Set([
  "meta",
  "spells",
  "items",
  "quests",
  "vendors",
  "dungeons",
  "zones",
  "classes",
  "itemsets",
  "professions",
  "gathering",
  "battlegrounds",
  "changes-seen",
  "articles",
  "posts"
]);

const SUPPORTED_LOCALES = new Set([
  "en_US",
  "es_ES",
  "es_MX",
  "pt_BR",
  "fr_FR",
  "de_DE",
  "it_IT",
  "ru_RU",
  "ko_KR",
  "zh_TW",
  "zh_CN"
]);

function normalizeLocale(value) {
  if (value === undefined || value === "") {
    return "en_US";
  }

  if (
    typeof value !== "string" ||
    !SUPPORTED_LOCALES.has(value.trim())
  ) {
    return null;
  }

  return value.trim();
}

async function getResource(req, res, next) {
  try {
    const { resource, id } = req.params;

    if (!ALLOWED_RESOURCES.has(resource)) {
      return res.status(404).json({
        success: false,
        error: {
          code: "UNSUPPORTED_FOREVERDB_RESOURCE",
          message: "El recurso solicitado no está disponible."
        }
      });
    }

    if (resource === "meta" && id) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_RESOURCE_PATH",
          message: "El recurso meta no admite un identificador."
        }
      });
    }

    if (id && !/^[a-zA-Z0-9_-]+$/.test(id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_RESOURCE_ID",
          message: "El identificador contiene caracteres no válidos."
        }
      });
    }

    const locale = normalizeLocale(req.query.locale);

    if (!locale) {
      return res.status(400).json({
        success: false,
        error: {
          code: "UNSUPPORTED_LOCALE",
          message:
            "Idioma no válido. Ejemplos admitidos: en_US, es_ES, es_MX."
        }
      });
    }

    const endpointPath = id
      ? `/${resource}/${encodeURIComponent(id)}`
      : `/${resource}`;

    // El idioma se gestiona en la caché, no se envía a ForeverDB.
    const params = Object.fromEntries(
      Object.entries(req.query).filter(
        ([key, value]) =>
          key !== "locale" &&
          (typeof value === "string" ||
            typeof value === "number")
      )
    );

    const result = await cache.getOrFetch({
      resource,
      id,
      params,
      locale,
      fetcher: async () => {
        const response = await foreverDb.get(endpointPath, params);
        return response.data;
      }
    });

    res.set("X-WoW-JSON-Cache", result.cache);
    res.set("X-WoW-Locale", locale);
    res.set(
      "X-WoW-Translation-Available",
      String(Boolean(result.translationAvailable))
    );
    res.set("Cache-Control", "public, max-age=60");

    const icons = Object.values(result.assets || {});

    if (icons.length > 0) {
      res.set("X-WoW-Local-Icons", JSON.stringify(icons));
    }

    return res.json(result.data);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        error: {
          code: error.code || "FOREVERDB_ERROR",
          message: error.message,
          ...(error.retryAfter
            ? { retryAfter: error.retryAfter }
            : {})
        }
      });
    }

    return next(error);
  }
}

module.exports = {
  getResource
};
