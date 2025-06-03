// mesasRoutes.js
const express = require("express");
const router = express.Router();
const mesasController = require("../controllers/mesasController");
const { authenticateToken, checkRole } = require("../middlewares/authMiddleware");

router.use(authenticateToken);

// Obtener todas las mesas
router.get("/", checkRole(["Administrador"]), mesasController.obtenerTodasMesas);

// Obtener mesas por ID de sede
router.get("/sedes/:id_sede/mesas", checkRole(["Administrador"]), mesasController.obtenerMesasPorSede);

// Crear nueva mesa para una sede
router.post("/sedes/:id_sede/mesas", checkRole(["Administrador"]), mesasController.crearMesa); // <--- ¡Mantén esta ruta así!

// Eliminar una mesa por su ID
router.delete("/mesas/:id_mesa", checkRole(["Administrador"]), mesasController.eliminarMesa);

// Obtener todas las sedes
router.get("/sedes", checkRole(["Administrador"]), mesasController.obtenerSedes);

module.exports = router;