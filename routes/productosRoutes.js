const express = require("express");
const router = express.Router();
const productosController = require("../controllers/productosController");
const { authenticateToken, checkRole } = require("../middlewares/authMiddleware");

// =============================================
// MIDDLEWARE GLOBAL
// =============================================
router.use(authenticateToken);

// =============================================
// RUTAS GENERALES (sin ID específico)
// =============================================
router.get("/", checkRole(["Administrador"]), productosController.obtenerTodosProductos);
router.post("/", checkRole(["Administrador"]), productosController.crearProducto);

// =============================================
// RUTAS ESPECÍFICAS (con ID)
// =============================================
router.get("/:id", checkRole(["Administrador"]), productosController.obtenerProductoPorId);
router.put("/:id", checkRole(["Administrador"]), productosController.actualizarProducto);
router.delete("/:id", checkRole(["Administrador"]), productosController.eliminarProducto);

module.exports = router;