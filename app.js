// utils/app.js
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors'); // Importa el middleware CORS
const authRoutes = require('./routes/authRoutes'); 
const sedesRoutes = require('./routes/sedesRoutes'); // Importa las rutas de sedes
const usuariosRoutes = require('./routes/usuariosRoutes')
//const productosRoutes = require('./routes/productosRoutes')

//app.use("/auth", sedesRoutes); 
const app = express();

// ===== 1. MIDDLEWARES BÁSICOS =====
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '/public')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));
app.use(cors());
app.use(express.json());

// ===== 2. MIDDLEWARES PERSONALIZADOS =====
// app.use((req, res, next) => {
//     console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
//     next();
// });

// ===== 3. RUTAS PRINCIPALES =====
app.use('/auth', authRoutes);
app.use('/auth/sedes', sedesRoutes);
app.use('/auth/usuarios', usuariosRoutes);
// app.use('/auth/productos', productosRoutes);

// ===== 3.1. RUTA PARA LA RAÍZ ("/") =====
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ===== 4. MANEJO DE ERRORES =====
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// ===== 5. INICIO DEL SERVIDOR =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT} - Modo: ${process.env.NODE_ENV || 'development'}`);
  });

