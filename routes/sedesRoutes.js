const express = require('express');
const router = express.Router();
const sedesController = require('../controllers/sedesController');

// Rutas para las sedes
router.get('/sedes', sedesController.obtenerTodasSedes);
router.get('/sedes/:id', sedesController.obtenerSedePorId);
router.post('/sedes', sedesController.crearSede);
router.put('/sedes/:id', sedesController.actualizarSede);
router.delete('/sedes/:id', sedesController.eliminarSede);

module.exports = router;
