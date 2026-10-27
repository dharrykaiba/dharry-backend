const express = require("express");
const cache = require("../services/wow-json-cache.service");
const router = express.Router();
router.get("/", (req, res) => res.json({ success: true, data: {
  name: "Dharry Backend", status: "online", architecture: "central-multiproject"
}}));
router.get("/health", (req, res) => res.json({ success: true, data: { status: "ok" } }));
router.get("/api/wow/cache/stats", async (req, res, next) => {
  try { return res.json({ success: true, data: await cache.getStats() }); }
  catch (error) { return next(error); }
});
module.exports = router;
