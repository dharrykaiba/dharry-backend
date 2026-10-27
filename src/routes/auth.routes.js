const express = require("express");
const controller = require("../controllers/auth.controller");
const router = express.Router();
router.get("/login/:provider", controller.beginLogin);
router.get("/callback/:provider", controller.callback);
router.get("/session", controller.session);
router.post("/logout", controller.logout);
module.exports = router;
