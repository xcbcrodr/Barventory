const express = require("express");
const router = express.Router();
const sedesController = require("../controllers/sedesController");
const { authenticateToken, checkRole } = require("../middlewares/authMiddleware"); // Importación corregida

// ===== MIDDLEWARE GLOBAL =====
// Aplica autenticación a TODAS las rutas de sedes
router.use(authenticateToken);

// ===== RUTAS =====
// 1. Obtener todas las sedes (solo Administrador)
router.get(
  "/",
  checkRole(["Administrador"]), // Solo para rol "Administrador"
  sedesController.obtenerTodasSedes
);

// 2. Obtener una sede por ID (Solo Administrador)
router.get(
  "/:id",
  checkRole(["Administrador"]), 
  sedesController.obtenerSedePorId
);

// 3. Crear nueva sede (Solo Administrador)
router.post(
  "/",
  checkRole(["Administrador"]),
  sedesController.crearSede
);

// 4. Actualizar sede (solo Administrador)
router.put(
  "/:id",
  checkRole(["Administrador"]),
  sedesController.actualizarSede
);

// 5. Eliminar sede (Solo Administrador)
router.delete(
  "/:id",
  checkRole(["Administrador"]),
  sedesController.eliminarSede
);

module.exports = router;