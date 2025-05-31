
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors'); 

// Importación de tus rutas (asegúrate que los nombres de archivo sean correctos)
const authRoutes = require('./routes/authRoutes'); // CAMBIO AQUÍ
const sedesRoutes = require('./routes/sedesRoutes'); // CAMBIO AQUÍ
const usuariosRoutes = require('./routes/usuariosRoutes'); // CAMBIO AQUÍ
const productosRoutes = require('./routes/productosRoutes'); // CAMBIO AQUÍ
const mesasRoutes = require('./routes/mesasRoutes'); // CAMBIO AQUÍ
const meseroRoutes = require('./routes/meseroRoutes'); // CAMBIO AQUÍ
const authMiddleware = require('./middlewares/authMiddleware'); // CAMBIO AQUÍ

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json()); 

// ===== CONFIGURACIÓN DE RUTAS ESTÁTICAS =====
// La carpeta 'public' está un nivel arriba de 'utils'.
// Esto hace que los archivos dentro de 'public' sean accesibles directamente.
// Por ejemplo, /index.html, /mesero/dashboardMesero.html, /admin/dashboardAdmin.html
app.use(express.static(path.join(__dirname, 'public'))); 

// Si quieres una ruta explícita para el login en la raíz (ej. localhost:3000/),
// esto lo asegura. Si no, `express.static` ya debería servir `index.html` si se pide `/index.html`.
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ===== REGISTRO DE RUTAS DE LA API =====
// Las rutas API siempre deben ir DESPUÉS de las configuraciones de archivos estáticos
// para evitar conflictos donde el servidor intente buscar un archivo estático en lugar de la API.
app.use('/auth', authRoutes);

// Asegúrate que los middlewares de autenticación y rol se apliquen correctamente a tus rutas protegidas.
app.use('/auth/sedes', authMiddleware.authenticateToken, authMiddleware.checkRole(['Administrador', 'Mesero']), sedesRoutes); 
app.use('/auth/usuarios', authMiddleware.authenticateToken, authMiddleware.checkRole('Administrador'), usuariosRoutes); 
app.use('/auth/productos', authMiddleware.authenticateToken, authMiddleware.checkRole('Administrador'), productosRoutes); 
app.use('/auth/mesas', authMiddleware.authenticateToken, authMiddleware.checkRole('Administrador'), mesasRoutes); 

// Las rutas del mesero usan sus propios middlewares dentro de meseroRoutes.js
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
