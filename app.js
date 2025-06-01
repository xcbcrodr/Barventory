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
const authMiddleware = require('./middlewares/authMiddleware'); 

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());

// ===== CONFIGURACIÓN DE RUTAS ESTÁTICAS =====
app.use(express.static(path.join(__dirname, 'public')));

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
app.use('/auth/mesero', meseroRoutes);

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