function notFound(req, res) { return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Endpoint no encontrado." } }); }
function errorHandler(error, req, res, next) { console.error(error); if (res.headersSent) return next(error); return res.status(error.status || 500).json({ success: false, error: { code: error.code || "INTERNAL_ERROR", message: error.publicMessage || "Error interno del servidor." } }); }
module.exports = { notFound, errorHandler };
