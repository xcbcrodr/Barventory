const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config(); 

const authRoutes = require('./routes/authRoutes');
const sedesRoutes = require('./routes/sedesRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
const productosRoutes = require('./routes/productosRoutes');
const mesasRoutes = require('./routes/mesasRoutes');
const meseroRoutes = require('./routes/meseroRoutes'); 
//const reporteRoutes = require('./routes/reporteRoutes'); 
const cajeroRoutes = require('./routes/cajeroRoutes'); 
const authMiddleware = require('./middlewares/authMiddleware'); 

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());

// ===== CONFIGURACIÓN DE RUTAS ESTÁTICAS =====
app.use(express.static(path.join(__dirname, 'public')));

app.get('/test-cajero', (req, res) => {
    console.log('--- Ruta de prueba /test-cajero alcanzada ---');
    try {
        throw new Error('ERROR FORZADO EN RUTA DE PRUEBA: Esto debe aparecer en el servidor.');
    } catch (error) {
        console.error('Error capturado en ruta de prueba:', error.message);
    }
    res.status(200).json({ message: 'Ruta de prueba exitosa, revisa la consola del servidor para logs.' });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ===== REGISTRO DE RUTAS DE LA API =====
app.use('/auth', authRoutes); // Rutas de autenticación (ej. /auth/login, /auth/register)

// Rutas protegidas para Administrador
app.use('/auth/sedes', authMiddleware.authenticateToken, authMiddleware.checkRole(['Administrador']), sedesRoutes);
app.use('/auth/usuarios', authMiddleware.authenticateToken, authMiddleware.checkRole('Administrador'), usuariosRoutes);
app.use('/auth/productos', authMiddleware.authenticateToken, authMiddleware.checkRole('Administrador'), productosRoutes);
app.use('/auth/mesas', authMiddleware.authenticateToken, authMiddleware.checkRole('Administrador'), mesasRoutes);
//app.use('/auth/reporte', authMiddleware.authenticateToken, authMiddleware.checkRole('Administrador'), reporteRoutes);
app.use('/auth/mesero', meseroRoutes);
app.use('/auth/cajero', cajeroRoutes);

// ===== MANEJO DE ERRORES =====
app.use((err, req, res, next) => {
    console.error("Error global de Express:", err.stack);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// ===== INICIO DEL SERVIDOR =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT} - Modo: ${process.env.NODE_ENV || 'development'}`);
});
