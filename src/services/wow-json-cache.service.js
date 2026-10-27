//src/services/wow-json-cache.service.js
"use strict";

const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const axios = require("axios");

const ROOT = path.resolve(
  process.env.WOW_DATA_DIR ||
    path.join(process.cwd(), "data", "wow-forever")
);

const ASSETS_DIR = path.join(ROOT, "assets");
const inFlight = new Map();

function safeSegment(value) {
  return (
    String(value).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 120) ||
    "resource"
  );
}

function canonicalQuery(params = {}) {
  return Object.fromEntries(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(([key, value]) => [
        key,
        Array.isArray(value) ? value.map(String).sort() : String(value)
      ])
      .sort(([a], [b]) => a.localeCompare(b))
  );
}

function cacheKey(resource, id, params) {
  const queryHash = Object.keys(params).length
    ? `__${crypto
        .createHash("sha256")
        .update(JSON.stringify(params))
        .digest("hex")
        .slice(0, 16)}`
    : "";

  return `${resource}/${id ? safeSegment(id) : "_list"}${queryHash}`;
}

function fileFor(key) {
  return path.join(ROOT, `${key}.json`);
}

async function read(key) {
  try {
    return JSON.parse(await fs.readFile(fileFor(key), "utf8"));
  } catch (error) {
    if (error.code === "ENOENT" || error instanceof SyntaxError) {
      return null;
    }

    throw error;
  }
}

async function write(key, payload) {
  const filename = fileFor(key);

  await fs.mkdir(path.dirname(filename), { recursive: true });

  const temp = `${filename}.${process.pid}.${crypto.randomUUID()}.tmp`;

  await fs.writeFile(
    temp,
    `${JSON.stringify(payload, null, 2)}\n`,
    "utf8"
  );

  await fs.rename(temp, filename);
}

function findIconUrls(value, output = []) {
  if (!value || typeof value !== "object") {
    return output;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      findIconUrls(item, output);
    }

    return output;
  }

  for (const [key, child] of Object.entries(value)) {
    const normalized = key.toLowerCase().replace(/[-\s]/g, "_");

    if (
      typeof child === "string" &&
      /^https?:\/\//i.test(child) &&
      /(icon|spell_icon|skill_icon|icon_url|iconurl)$/.test(normalized)
    ) {
      output.push({ key, url: child });
    } else if (child && typeof child === "object") {
      findIconUrls(child, output);
    }
  }

  return output;
}

async function downloadIcon(url) {
  await fs.mkdir(ASSETS_DIR, { recursive: true });

  const extension = (() => {
    try {
      const ext = path.extname(new URL(url).pathname).toLowerCase();

      return [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"].includes(ext)
        ? ext
        : ".img";
    } catch {
      return ".img";
    }
  })();

  const filename = `${crypto
    .createHash("sha256")
    .update(url)
    .digest("hex")}${extension}`;

  const destination = path.join(ASSETS_DIR, filename);

  try {
    await fs.access(destination);
  } catch {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 12000,
      maxContentLength: 8 * 1024 * 1024,
      maxBodyLength: 8 * 1024 * 1024,
      headers: {
        Accept: "image/*,*/*;q=0.8",
        "User-Agent": "DharryStats/1.0"
      },
      validateStatus: status => status >= 200 && status < 300
    });

    const contentType = String(
      response.headers["content-type"] || ""
    ).toLowerCase();

    if (contentType && !contentType.startsWith("image/")) {
      throw new Error(
        `La URL del icono no devolvió una imagen (${contentType})`
      );
    }

    const temp = `${destination}.${process.pid}.tmp`;

    await fs.writeFile(temp, Buffer.from(response.data));
    await fs.rename(temp, destination);
  }

  return {
    filename,
    url: `/api/wow/cache-assets/${filename}`
  };
}

async function localizeIcons(data) {
  const icons = findIconUrls(data);
  const assets = {};

  for (const icon of icons) {
    try {
      assets[icon.url] = await downloadIcon(icon.url);
    } catch (error) {
      console.warn(
        "[WOW cache] No se pudo descargar icono:",
        error.message
      );
    }
  }

  return assets;
}

/**
 * ForeverDB suele responder con esta estructura:
 * {
 *   data: { id, name, rank, description, icon, url },
 *   meta: { build, attribution }
 * }
 */
function getResourceData(responseData) {
  if (
    responseData &&
    responseData.data &&
    typeof responseData.data === "object" &&
    !Array.isArray(responseData.data)
  ) {
    return responseData.data;
  }

  return null;
}

/**
 * Registra los textos originales como en_US sin eliminar
 * ningún campo que ya devuelva ForeverDB.
 */
function ensureEnglishLocale(responseData) {
  const resourceData = getResourceData(responseData);

  if (!resourceData) {
    return false;
  }

  let changed = false;

  if (
    !resourceData.locales ||
    typeof resourceData.locales !== "object" ||
    Array.isArray(resourceData.locales)
  ) {
    resourceData.locales = {};
    changed = true;
  }

  if (!resourceData.locales.en_US) {
    resourceData.locales.en_US = {
      name: resourceData.name ?? null,
      rank: resourceData.rank ?? null,
      description: resourceData.description ?? null
    };

    changed = true;
  }

  return changed;
}

function hasUsefulTranslation(translation) {
  return Boolean(
    translation &&
      typeof translation === "object" &&
      (translation.name || translation.description || translation.rank)
  );
}

/**
 * Añade una traducción al mismo JSON.
 * No crea otro archivo para cada idioma.
 */
async function ensureLocale({
  record,
  key,
  locale,
  translate
}) {
  const resourceData = getResourceData(record.data);

  if (!resourceData) {
    return {
      record,
      translated: false
    };
  }

  const englishAdded = ensureEnglishLocale(record.data);

  if (englishAdded) {
    await write(key, record);
  }

  if (record.data.data.locales[locale]) {
    return {
      record,
      translated: true
    };
  }

  // El inglés ya está representado por la respuesta original.
  if (locale === "en_US") {
    return {
      record,
      translated: true
    };
  }

  // Recursos sin proveedor de traducción: conservamos el original.
  if (typeof translate !== "function") {
    return {
      record,
      translated: false
    };
  }

  try {
    const translation = await translate(locale, resourceData);

    if (!hasUsefulTranslation(translation)) {
      return {
        record,
        translated: false
      };
    }

    record.data.data.locales[locale] = {
      name: translation.name ?? resourceData.name ?? null,
      rank: translation.rank ?? resourceData.rank ?? null,
      description:
        translation.description ?? resourceData.description ?? null
    };

    record._cache ||= {};
    record._cache.updatedAt = new Date().toISOString();

    await write(key, record);

    return {
      record,
      translated: true
    };
  } catch (error) {
    console.warn(
      `[WOW cache] No se pudo obtener traducción ${locale}:`,
      error.message
    );

    return {
      record,
      translated: false
    };
  }
}

/**
 * Crea una copia para la respuesta HTTP y aplica el idioma.
 * El archivo original conserva sus campos base en inglés.
 */
function buildLocalizedResponse(responseData, locale) {
  const output = JSON.parse(JSON.stringify(responseData));
  const resourceData = getResourceData(output);

  if (!resourceData) {
    return output;
  }

  const selected = resourceData.locales?.[locale];

  if (selected) {
    if (selected.name != null) {
      resourceData.name = selected.name;
    }

    if (selected.rank != null) {
      resourceData.rank = selected.rank;
    }

    if (selected.description != null) {
      resourceData.description = selected.description;
    }
  }

  resourceData.locale = locale;

  return output;
}

async function getOrFetch({
  resource,
  id,
  params = {},
  fetcher,
  cacheGroup = "foreverdb",
  locale = "en_US",
  translate
}) {
  const normalized = canonicalQuery(params);
  const key = `${cacheGroup}/${cacheKey(resource, id, normalized)}`;

  const cached = await read(key);

  if (cached && Object.prototype.hasOwnProperty.call(cached, "data")) {
    const result = await ensureLocale({
      record: cached,
      key,
      locale,
      translate
    });

    return {
      data: buildLocalizedResponse(result.record.data, locale),
      cache: "HIT",
      assets: result.record.assets || {},
      locale,
      translationAvailable: result.translated
    };
  }

  if (inFlight.has(key)) {
    const shared = await inFlight.get(key);

    const record = shared.record;

    const result = await ensureLocale({
      record,
      key,
      locale,
      translate
    });

    return {
      data: buildLocalizedResponse(result.record.data, locale),
      cache: "COALESCED",
      assets: result.record.assets || {},
      locale,
      translationAvailable: result.translated
    };
  }

  const pending = (async () => {
    const data = await fetcher();
    const assets = await localizeIcons(data);

    const record = {
      _cache: {
        source: cacheGroup,
        resource,
        id: id || null,
        params: normalized,
        fetchedAt: new Date().toISOString()
      },
      data,
      assets
    };

    ensureEnglishLocale(record.data);

    await write(key, record);

    return {
      data,
      assets,
      record
    };
  })();

  inFlight.set(key, pending);

  try {
    const fetched = await pending;

    const result = await ensureLocale({
      record: fetched.record,
      key,
      locale,
      translate
    });

    return {
      data: buildLocalizedResponse(result.record.data, locale),
      cache: "MISS",
      assets: result.record.assets || {},
      locale,
      translationAvailable: result.translated
    };
  } finally {
    inFlight.delete(key);
  }
}

/**
 * Caché de hechizos de Blizzard.
 * Mantiene el idioma fuera de la clave para reutilizar un mismo registro.
 */
async function getSpellOrFetch({
  spellId,
  locale = "en_US",
  fetcher
}) {
  return getOrFetch({
    resource: "spells",
    id: spellId,
    params: {},
    cacheGroup: "blizzard",
    locale,
    fetcher
  });
}

async function getStats() {
  let files = 0;
  let bytes = 0;

  async function walk(directory) {
    let entries = [];

    try {
      entries = await fs.readdir(directory, {
        withFileTypes: true
      });
    } catch {
      return;
    }

    for (const entry of entries) {
      const full = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        await walk(full);
      } else {
        files++;

        try {
          bytes += (await fs.stat(full)).size;
        } catch {}
      }
    }
  }

  await walk(ROOT);

  return {
    directory: ROOT,
    files,
    bytes
  };
}

module.exports = {
  ROOT,
  ASSETS_DIR,
  getOrFetch,
  getSpellOrFetch,
  getStats
};