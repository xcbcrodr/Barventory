const express = require("express");
const router = express.Router();
const usuariosController = require("../controllers/usuariosController");
const { authenticateToken, checkRole } = require("../middlewares/authMiddleware");

// =============================================
// MIDDLEWARE GLOBAL
// =============================================
router.use(authenticateToken);

// =============================================
// RUTAS GENERALES (sin ID específico)
// =============================================
router.get("/", checkRole(["Administrador"]), usuariosController.obtenerTodosUsuarios);
router.get("/roles", checkRole(["Administrador"]), usuariosController.obtenerRoles);
router.get("/sedes", checkRole(["Administrador"]), usuariosController.obtenerSedes);
router.post("/", checkRole(["Administrador"]), usuariosController.crearUsuario);

// =============================================
// RUTAS ESPECÍFICAS (con ID)
// =============================================
router.get("/:id", checkRole(["Administrador"]), usuariosController.obtenerUsuarioPorId);
router.put("/:id", checkRole(["Administrador"]), usuariosController.actualizarUsuario);
//router.delete("/:id", checkRole(["Administrador"]), usuariosController.eliminarUsuario);
router.delete("/:id", usuariosController.eliminarUsuario); // Comenta el middleware temporalmente

module.exports = router;