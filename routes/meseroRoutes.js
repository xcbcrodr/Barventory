// routes/meseroRoutes.js
const express = require('express');
const router = express.Router();
const meseroController = require('../controllers/meseroController');
const authMiddleware = require('../middlewares/authMiddleware'); 

router.use(authMiddleware.authenticateToken);
router.use(authMiddleware.checkRole(['Mesero']));

router.get('/mesas', meseroController.getMesasPorSede);
router.get('/productos', meseroController.getProductosPorSede);
router.post('/pedidos', meseroController.registrarPedido);

module.exports = router;