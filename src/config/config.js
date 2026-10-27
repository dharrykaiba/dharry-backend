//src/config/config.js
const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });

const isProduction = process.env.NODE_ENV === "production";
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  server: {
    port: Number(process.env.PORT) || 4000
  },
  database: {
    url: process.env.DATABASE_URL,
    logging: process.env.DB_LOGGING === "true"
  },
  session: {
    secret: process.env.SESSION_SECRET,
    name: process.env.SESSION_COOKIE_NAME || "dharry.sid",
    maxAge: Number(process.env.SESSION_MAX_AGE) || 1000 * 60 * 60 * 24 * 7,
    secure: process.env.SESSION_COOKIE_SECURE === "true" || isProduction,
    sameSite: process.env.SESSION_COOKIE_SAMESITE || "lax"
  },
  cors: {
    origin: frontendUrl
  },
  frontendUrl,
  blizzard: {
    clientId: process.env.BLIZZARD_CLIENT_ID,
    clientSecret: process.env.BLIZZARD_CLIENT_SECRET,
    region: process.env.BLIZZARD_REGION || "us",
    redirectUri:
      process.env.BLIZZARD_REDIRECT_URI ||
      "http://localhost:4000/auth/callback"
  },
  wowRegions: [
    { id: "us", name: "North America" },
    { id: "eu", name: "Europe" },
    { id: "kr", name: "Korea" },
    { id: "tw", name: "Taiwan" }
  ],
  wowProducts: [
    { id: "retail", name: "Retail", namespacePrefix: "profile" },
    { id: "classic", name: "Classic Progression", namespacePrefix: "profile-classic" },
    { id: "classic1x", name: "Classic Era", namespacePrefix: "profile-classic1x" },
    { id: "classicann", name: "TBC Anniversary", namespacePrefix: "profile-classicann" },
    { id: "forever", name: "WoW Forever", namespacePrefix: "profile-forever" }
  ],
  projects: {
    bootstrap: [
      { key: "dharrystats", name: "DharryStats", description: "World of Warcraft statistics and tools" },
      { key: "dieseldharry", name: "DieselDharry", description: "DieselDharry project" },
      { key: "dharrynet", name: "DharryNet", description: "DharryNet project" }
    ]
  },
  foreverDb: {
    baseUrl: "https://foreverdb.net/api/v1",
    apiKey: process.env.FOREVERDB_API_KEY
  },
};

for (const [name, value] of Object.entries({
  DATABASE_URL: config.database.url,
  SESSION_SECRET: config.session.secret,
  BLIZZARD_CLIENT_ID: config.blizzard.clientId,
  BLIZZARD_CLIENT_SECRET: config.blizzard.clientSecret
})) {
  if (!value) throw new Error(`Falta ${name} en .env`);
}

module.exports = config;
