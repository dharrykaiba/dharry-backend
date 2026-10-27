//src/intefrations/battlenet/game-data.client.js
const axios = require("axios");
const config = require("../../config/config");

const api = axios.create({
  baseURL: `https://${config.blizzard.region}.api.blizzard.com`,
  timeout: 15000
});

let cachedToken = null;
let tokenExpiresAt = 0;

async function getApplicationToken() {
  // Renovar el token un minuto antes de su vencimiento.
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const response = await axios.post(
    "https://oauth.battle.net/token",
    new URLSearchParams({
      grant_type: "client_credentials"
    }).toString(),
    {
      auth: {
        username: config.blizzard.clientId,
        password: config.blizzard.clientSecret
      },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      timeout: 15000
    }
  );

  cachedToken = response.data.access_token;
  tokenExpiresAt =
    Date.now() + Number(response.data.expires_in || 0) * 1000;

  return cachedToken;
}

async function getSpell(spellId, locale = "es_ES") {
  const token = await getApplicationToken();

  const params = {
    namespace: `static-${config.blizzard.region}`,
    locale
  };

  const headers = {
    Authorization: `Bearer ${token}`
  };

  // Consultar los datos y los medios del hechizo.
  const [spellResult, mediaResult] = await Promise.allSettled([
    api.get(`/data/wow/spell/${spellId}`, {
      params,
      headers
    }),
    api.get(`/data/wow/media/spell/${spellId}`, {
      params,
      headers
    })
  ]);

  if (spellResult.status === "rejected") {
    throw spellResult.reason;
  }

  const spell = spellResult.value.data;

  const media =
    mediaResult.status === "fulfilled"
      ? mediaResult.value.data
      : null;

  const iconAsset = media?.assets?.find(
    (asset) => asset.key === "icon"
  );

  return {
    id: spell.id,
    name: spell.name,
    description: spell.description || "",
    icon: iconAsset?.value || null,
    mediaAvailable: Boolean(iconAsset?.value)
  };
}



async function testSpellNamespaces(spellId = 116) {
  const token = await getApplicationToken();

  const namespaces = [
    "static-us",
    "static-classic-us",
    "static-classic1x-us",
    "static-classicann-us",
    "static-forever-us"
  ];

  const results = await Promise.all(
    namespaces.map(async namespace => {
      try {
        const response = await api.get(
          `https://${config.blizzard.region}.api.blizzard.com/data/wow/spell/${spellId}`,
          {
            params: {
              namespace,
              locale: "en_US"
            },
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        return {
          namespace,
          status: response.status,
          id: response.data.id,
          name: response.data.name
        };
      } catch (error) {
        return {
          namespace,
          status: error.response?.status || 500,
          error: error.response?.data || error.message
        };
      }
    })
  );

  console.dir(results, { depth: null });
  return results;
}



module.exports = {
  getApplicationToken,
  getSpell,
  testSpellNamespaces
};