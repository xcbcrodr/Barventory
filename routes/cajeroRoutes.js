// routes/cajeroRoutes.js

const express = require('express');
const router = express.Router();
const cajeroController = require('../controllers/cajeroController'); 
router.get('/mesas-pendientes', cajeroController.getMesasConPedidosPendientes);

router.get('/pedidos/:id', cajeroController.getDetallePedidoParaCajero); 

router.get('/metodos-pago', cajeroController.getMetodosPago);

router.post('/procesar-pago', cajeroController.procesarPago);

module.exports = router;