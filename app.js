// utils/app.js
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors'); // Importa el middleware CORS
const authRoutes = require('./routes/authRoutes'); // Ajusta la ruta si es necesario
const sedesRoutes = require('./routes/sedesRoutes'); // Importa las rutas de sedes

const app = express();

// ===== 1. MIDDLEWARES BÁSICOS (SIEMPRE AL INICIO) =====
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '/public')));
app.use('/admin', express.static(path.join(__dirname, 'admin'))); 
app.use(cors()); // Habilita CORS para permitir peticiones desde tu frontend
app.use(express.json());

// ===== 2. MIDDLEWARES PERSONALIZADOS =====
// (Opcional) Logger de solicitudes
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// ===== 3. RUTAS PRINCIPALES =====
app.use('/auth', authRoutes);
app.use('/auth/sedes', sedesRoutes);

// ===== 3.1. RUTA PARA LA RAÍZ ("/") =====
app.get('/', (req, res) => {
    // Envía el archivo index.html que está en tu directorio 'public'
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ===== 4. MANEJO DE ERRORES (SIEMPRE AL FINAL) =====
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// ===== 5. INICIO DEL SERVIDOR =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

