// routes/meseroRoutes.js
const express = require('express');
const router = express.Router();
const meseroController = require('../controllers/meseroController');
const { authenticateToken, checkRole } = require('../middlewares/authMiddleware');

router.use(authenticateToken);
router.use(checkRole(['Mesero']));

router.get('/mesas', meseroController.getMesasPorSede);
router.get('/productos', meseroController.getProductosPorSede);
router.post('/pedidos', meseroController.registrarPedido);

module.exports = router;