const express = require("express");
const router = express.Router();
/*const { client } = require("../utils/db"); // Importación necesaria para las pruebas*/
const sedesController = require("../controllers/sedesController");
const { authenticateToken, checkRole } = require("../middlewares/authMiddleware");

// =============================================
// MIDDLEWARE GLOBAL (protege las rutas siguientes)
// =============================================
router.use(authenticateToken);

// =============================================
// RUTAS PROTEGIDAS (requieren autenticación y rol)
// =============================================

// 1. Obtener todas las sedes (solo Administrador)
/*router.get("/", checkRole(["Administrador"]), (req, res, next) => {
  // Saltar temporalmente el middleware de autenticación
  sedesController.obtenerTodasSedes(req, res);
});*/

router.get("/", checkRole(["Administrador"]), (req, res, next) => {
  console.log("Debug Sedes - Inicio de petición");
  // Mantenemos el middleware original pero añadimos debug
  const originalJson = res.json;
  res.json = function(data) {
    console.log("Debug Sedes - Datos a enviar:", {
      tipo: typeof data,
      cantidad: Array.isArray(data) ? data.length : '-',
      muestra: Array.isArray(data) ? data[0] : data
    });
    originalJson.call(res, data);
  };
  next();
}, sedesController.obtenerTodasSedes);

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