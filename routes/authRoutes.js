const express = require('express');
const router = express.Router(); // para definición de rutas
//const authController = require('../controllers/loginController');
const authController = require('../controllers/authController');
const { authenticateToken, checkRole } = require('../middlewares/authMiddleware');

// ===== VERIFICACIÓN DE CONTROLADORES =====
// Asegúrate que estos métodos existan en authController
if (!authController.login || typeof authController.login !== 'function') {
  throw new Error('authController.login no es una función válida');
}
if (!authController.getRoles || typeof authController.getRoles !== 'function') {
  throw new Error('authController.getRoles no es una función válida');
}
if (!authController.getSedes || typeof authController.getSedes !== 'function') {
  throw new Error('authController.getSedes no es una función válida');
}

// If que se recomienda quitar para paso a producción
if (!authController.getProfile || typeof authController.getProfile !== 'function') {
  throw new Error('authController.getProfile no es una función válida');
}
if (!authController.adminDashboard || typeof authController.adminDashboard !== 'function') {
  throw new Error('authController.adminDashboard no es una función válida');
}
if (!authController.cashierDashboard || typeof authController.cashierDashboard !== 'function') {
  throw new Error('authController.cashierDashboard no es una función válida');
}

// ===== RUTAS PÚBLICAS =====
router.post('/login', authController.login);
router.get('/roles', authController.getRoles);
router.get('/sedes', authController.getSedes);

// ===== RUTAS PROTEGIDAS =====
router.use(authenticateToken);

router.get('/profile', authController.getProfile);
//router.get('/admin/dashboard', checkRole(['admin']), authController.adminDashboard);
router.get('/admin/dashboardAdmin.html', checkRole(['Administrador']), authController.adminDashboard);
router.get('/cajero/dashboard', checkRole(['cajero']), authController.cashierDashboard);
// router.get('/mesero/dashboard', checkRole(['mesero']), authController.waitressDashboard); se implementara para cuando se confirme que este bien el desarrollo de los middlewares

module.exports = router;

