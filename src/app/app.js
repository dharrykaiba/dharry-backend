//src/app/app.js
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const SequelizeStore = require("connect-session-sequelize")(session.Store);
const path = require("path");
const config = require("../config/config");
const { sequelize } = require("../core/database");
const cache = require("../services/wow-json-cache.service");
const indexRoutes = require("../routes/index.routes");
const authRoutes = require("../routes/auth.routes");
const projectRoutes = require("../routes/project.routes");
const wowRoutes = require("../routes/wow.routes");
const legacyRoutes = require("../routes/legacy.routes");
const { notFound, errorHandler } = require("../middleware/errorHandler");

function createApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.use(cors({ origin: config.cors.origin, credentials: true, exposedHeaders: [
    "X-WoW-JSON-Cache", "X-WoW-Local-Icons", "X-ForeverDB-RateLimit",
    "X-ForeverDB-Remaining", "X-ForeverDB-Reset", "X-ForeverDB-Daily-Limit",
    "X-ForeverDB-Daily-Remaining"
  ]}));
  app.use(express.json({ limit: "1mb" }));
  const store = new SequelizeStore({ db: sequelize, tableName: "Sessions", checkExpirationInterval: 15 * 60 * 1000, expiration: config.session.maxAge });
  app.use(session({
    name: config.session.name, secret: config.session.secret, store,
    resave: false, saveUninitialized: false,
    cookie: { httpOnly: true, secure: config.session.secure, sameSite: config.session.sameSite, maxAge: config.session.maxAge }
  }));

  // Serves locally downloaded spell/resource icons from the JSON cache directory.
  app.use("/api/wow/cache-assets", express.static(cache.ASSETS_DIR, {
    fallthrough: false, maxAge: "30d", immutable: true,
    setHeaders(res) { res.setHeader("X-Content-Type-Options", "nosniff"); }
  }));

  app.use("/", indexRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/projects", projectRoutes);
  app.use("/api/wow", wowRoutes);
  app.use("/", legacyRoutes);
  app.use("/wow", wowRoutes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
module.exports = { createApp };
