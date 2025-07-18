const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

//const client = require('./utils/db'); 

const pool = require('./utils/db');


// --- ATENCIÓN: ESTOS HANDLERS SON CRÍTICOS PARA CAPTURAR ERRORES NO MANEJADOS ---
// Captura de errores no manejados por promesas

process.on('unhandledRejection', (reason, promise) => {
    console.error('\n\n--- ERROR CRÍTICO NO MANEJADO: Promesa Rechazada ---\n');
    console.error('Razón:', reason);
    console.error('Promesa:', promise);
    console.error('Stack:', reason.stack || 'No stack trace disponible para la razón.');
});


// Captura de excepciones no capturadas (errores síncronos)

process.on('uncaughtException', (err) => {
    console.error('\n\n--- ERROR CRÍTICO NO MANEJADO: Excepción Síncrona ---\n');
    console.error('Error:', err);
    console.error('Stack:', err.stack);

    // Es CRÍTICO salir en caso de uncaughtException para evitar estados inestables
    process.exit(1); // Esta es la línea CORRECTA y ÚNICA para salir
});


// ELIMINAR O COMENTAR ESTAS LÍNEAS DUPLICADAS Y FUERA DE LUGAR
//     process.error('FORZANDO SALIDA DEL PROCESO DEBIDO A UNCAUGHT EXCEPTION.'); 
//     process.exit(1); 

// -----------------------------------------------------------------------------
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

// ===== CONFIGURACIÓN DE RUTAS ESTÁTICAS =====
app.use(express.static(path.join(__dirname, 'public')));

app.get('/test-cajero', (req, res) => {
    console.log('--- Ruta de prueba /test-cajero alcanzada ---');
    // throw new Error('Este es un error de prueba forzado para el middleware de errores.');
    res.status(200).json({ message: 'Ruta de prueba exitosa, revisa la consola del servidor para logs.' });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use('/auth', authRoutes); // Rutas de autenticación (ej. /auth/login, /auth/register)

// Rutas protegidas para Administrador
app.use('/auth/sedes', authMiddleware.authenticateToken, authMiddleware.checkRole(['Administrador']), sedesRoutes);
app.use('/auth/usuarios', authMiddleware.authenticateToken, authMiddleware.checkRole('Administrador'), usuariosRoutes);
app.use('/auth/productos', authMiddleware.authenticateToken, authMiddleware.checkRole('Administrador'), productosRoutes);
app.use('/auth/mesas', authMiddleware.authenticateToken, authMiddleware.checkRole('Administrador'), mesasRoutes);
//app.use('/auth/reporte', authMiddleware.authenticateToken, authMiddleware.checkRole('Administrador'), reporteRoutes);

// Rutas protegidas para Mesero
app.use('/auth/mesero', authMiddleware.authenticateToken, authMiddleware.checkRole(['Mesero']), meseroRoutes);

// Rutas protegidas para Cajero
console.log("[DEBUG] Configurando rutas de cajero...");
app.use('/auth/cajero', 
    (req, res, next) => {
        console.log(`[DEBUG] Solicitud a /auth/cajero recibida: ${req.method} ${req.originalUrl}`);
        next();
    },
    authMiddleware.authenticateToken, 
    (req, res, next) => {
        console.log("[DEBUG] authMiddleware.authenticateToken ejecutado. req.user:", req.user);
        if (!req.user) { // Doble chequeo aquí
            console.error("[ERROR] authMiddleware.authenticateToken no estableció req.user. Esto es un problema.");
        }
        next();
    },
    authMiddleware.checkRole(['Cajero']),
    (req, res, next) => {
        console.log("[DEBUG] authMiddleware.checkRole ejecutado. Acceso concedido para Cajero.");
        next();
    },
    cajeroRoutes
);

app.use((err, req, res, next) => {
    console.error("\n\n--- ERROR CAPTURADO POR MIDDLEWARE DE EXPRESS ---\n");
    console.error("Error global de Express:", err); // Log el objeto de error completo
    console.error("Stack Trace:", err.stack); // Asegúrate de loguear el stack trace
    res.status(500).json({ error: 'Error interno del servidor' });
});

async function testDbConnection() {
    try {
        //await client.query('SELECT NOW()'); 
        await pool.query('SELECT NOW()'); 
        console.log('🎉 Conexión a la base de datos PostgreSQL exitosa.');
    } catch (error) {
        console.error('❌ Error de conexión inicial del Pool a PostgreSQL:', error);
        console.error('Asegúrate de que PostgreSQL esté corriendo y las credenciales en .env sean correctas.');
        process.exit(1); // Detén la aplicación si no puede conectar a la DB
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => { 
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT} - Modo: ${process.env.NODE_ENV || 'development'}`);
    await testDbConnection(); 
});
