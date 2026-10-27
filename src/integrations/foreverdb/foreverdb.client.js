//src/integrations/foreverdb/foreverdb.client.js
const axios = require("axios");
const config = require("../../config/config");

const api = axios.create({
  baseURL: config.foreverDb.baseUrl,
  timeout: 15000,
  headers: {
    Accept: "application/json"
  }
});

async function get(path, params = {}) {
  const apiKey = config.foreverDb.apiKey;

  if (!apiKey) {
    const error = new Error(
      "Falta configurar FOREVERDB_API_KEY en el .env"
    );
    error.status = 503;
    error.code = "FOREVERDB_API_KEY_MISSING";
    throw error;
  }

  try {
    const response = await api.get(path, {
      params,
      headers: {
        "X-API-Key": apiKey
      }
    });

    return {
      data: response.data,
      headers: {
        rateLimit: response.headers["x-ratelimit-limit"],
        remaining: response.headers["x-ratelimit-remaining"],
        reset: response.headers["x-ratelimit-reset"],
        dailyLimit: response.headers["x-daily-limit"],
        dailyRemaining: response.headers["x-daily-remaining"]
      }
    };
  } catch (error) {
    if (error.response) {
      const apiError = new Error(
        error.response.data?.error?.message ||
        "Error al consultar ForeverDB"
      );

      apiError.status = error.response.status;
      apiError.code =
        error.response.data?.error?.code ||
        "FOREVERDB_REQUEST_FAILED";
      apiError.retryAfter = error.response.headers["retry-after"];

      throw apiError;
    }

    throw error;
  }
}

module.exports = { get };
