const express = require('express');
const router = express.Router();
const cajeroController = require('../controllers/cajeroController'); 
const { authenticateToken, checkRole } = require('../middlewares/authMiddleware');

router.use(authenticateToken);
//router.use(checkRole(['Cajero'])); // Solo los usuarios con rol 'Cajero' podrán acceder a estas rutas

router.get('/mesas-pendientes', cajeroController.getMesasConPedidosPendientes);

router.get('/pedido/:idPedido', cajeroController.getDetallePedidoParaCajero);

router.get('/metodos-pago', cajeroController.getMetodosPago);

router.post('/procesar-pago', cajeroController.procesarPago);

module.exports = router;