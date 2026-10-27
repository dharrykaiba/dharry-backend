//src/routes/wow.routes.js
const express = require("express");
const controller = require("../modules/wow/wow.controller");
const spellController = require("../modules/wow/spell.controller");
const foreverDbController = require("../modules/wow/foreverdb.controller");
const wowheadController = require("../modules/wow/wowhead.controller");

const router = express.Router();

router.get("/profile", controller.profile);
router.get("/spells/:id", spellController.getById);

// ForeverDB: listas y detalles de recursos
router.get("/forever/:resource", foreverDbController.getResource);
router.get("/forever/:resource/:id", foreverDbController.getResource);

// Dentro de las rutas existentes:
router.get("/wowhead/items/:id", wowheadController.getItemXml);

module.exports = router;
