
"use strict";

const axios = require("axios");
const cache = require("../../services/wow-json-cache.service");

const WOWHEAD_XML_BASE = "https://www.wowhead.com/item=";

function decodeXml(value = "") {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}

function getTag(xml, tagName) {
  const escaped = tagName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = xml.match(
    new RegExp(`<${escaped}\\b[^>]*>([\\s\\S]*?)</${escaped}\\s*>`, "i")
  );

  return match ? decodeXml(match[1]) : null;
}

function getTagAttribute(xml, tagName, attribute) {
  const escapedTag = tagName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedAttr = attribute.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const tag = xml.match(new RegExp(`<${escapedTag}\\b([^>]*)>`, "i"));

  if (!tag) return null;

  const match = tag[1].match(
    new RegExp(`\\b${escapedAttr}\\s*=\\s*["']([^"']*)["']`, "i")
  );

  return match ? decodeXml(match[1]) : null;
}

function plainText(html) {
  return decodeXml(
    String(html || "")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<\/(p|div|li)>/gi, " ")
      .replace(/<[^>]*>/g, " ")
  ).replace(/\s+/g, " ").trim();
}

function parseItemXml(xml, requestedId) {
  if (!/<item\b/i.test(xml)) {
    const error = new Error("Wowhead no devolvió un objeto reconocible.");
    error.status = 502;
    error.code = "WOWHEAD_INVALID_XML";
    throw error;
  }

  const name = getTag(xml, "name");
  const icon = getTag(xml, "icon");
  const qualityId = getTagAttribute(xml, "quality", "id");
  const tooltipHtml = getTag(xml, "htmlTooltip");

  if (!name) {
    const error = new Error("El XML no contiene el nombre del objeto.");
    error.status = 502;
    error.code = "WOWHEAD_ITEM_DATA_MISSING";
    throw error;
  }

  const numeric = value => {
    if (value == null || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  };

  return {
    data: {
      id: Number(requestedId),
      name,
      source: "wowhead_xml",
      sourceVersion: "not-verified-for-wow-forever",
      quality: numeric(qualityId),
      itemLevel: numeric(getTag(xml, "level")),
      requiredLevel: numeric(getTag(xml, "requiredLevel")),
      inventorySlot: getTag(xml, "inventorySlot"),
      itemClass: getTag(xml, "class"),
      itemSubClass: getTag(xml, "subclass"),
      icon,
      iconUrl: icon
        ? `https://wow.zamimg.com/images/wow/icons/large/${encodeURIComponent(icon)}.jpg`
        : null,
      tooltipText: tooltipHtml ? plainText(tooltipHtml) : null
    },
    meta: {
      source: "Wowhead XML",
      attribution: "Los datos proceden de Wowhead; no se garantiza que coincidan con WoW Forever."
    }
  };
}

async function getItemXml(req, res, next) {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id) || Number(id) <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_ITEM_ID",
          message: "El identificador del objeto debe ser un número positivo."
        }
      });
    }

    const result = await cache.getOrFetch({
      resource: "items",
      id,
      params: {},
      locale: "en_US",
      cacheGroup: "wowhead-xml",
      fetcher: async () => {
        const response = await axios.get(
          `${WOWHEAD_XML_BASE}${encodeURIComponent(id)}&xml`,
          {
            timeout: 12000,
            responseType: "text",
            maxContentLength: 2 * 1024 * 1024,
            headers: {
              Accept: "application/xml,text/xml;q=0.9,*/*;q=0.5",
              "User-Agent": "DharryStats/1.0"
            },
            validateStatus: status => status >= 200 && status < 300
          }
        );

        return parseItemXml(String(response.data), id);
      }
    });

    res.set("X-WoW-JSON-Cache", result.cache);
    res.set("X-WoW-Data-Source", "wowhead-xml");
    res.set("Cache-Control", "public, max-age=300");

    return res.json(result.data);
  } catch (error) {
    if (error.response) {
      return res.status(502).json({
        success: false,
        error: {
          code: "WOWHEAD_REQUEST_FAILED",
          message: "No se pudieron obtener los datos del objeto desde Wowhead."
        }
      });
    }

    if (error.status) {
      return res.status(error.status).json({
        success: false,
        error: {
          code: error.code || "WOWHEAD_XML_ERROR",
          message: error.message
        }
      });
    }

    return next(error);
  }
}

module.exports = { getItemXml };
