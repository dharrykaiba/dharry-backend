const express = require("express");
const auth = require("../controllers/auth.controller");
const router = express.Router();
router.get("/login", auth.beginLogin);
router.get("/auth/callback", auth.callback);
router.get("/auth/session", auth.legacySession);
router.post("/auth/logout", auth.logout);
module.exports = router;
