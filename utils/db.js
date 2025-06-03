const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    // AÑADE ESTA LÍNEA PARA DESHABILITAR SSL
    ssl: false, // <--- CAMBIO CRÍTICO AQUÍ
    // O si quieres ser más explícito y tu servidor realmente no tiene certificados:
    // ssl: {
    //     rejectUnauthorized: false // Esto solo es para desarrollo, no para producción
    // }
    // En tu caso, el error sugiere que el servidor no lo soporta en absoluto,
    // por lo que 'ssl: false' es la solución más directa.

    connectionTimeoutMillis: 10000, // Puedes mantener esto o ajustarlo
    idleTimeoutMillis: 30000,
    max: 20
});

pool.on('error', (err, client) => {
    console.error('Error inesperado en el pool de clientes de PostgreSQL', err);
    // process.exit(-1); // Considera si quieres que la app se caiga o maneje esto de otra forma
});

async function testDbConnection() {
    try {
        const client = await pool.connect();
        console.log('🎉 Conexión a la base de datos PostgreSQL exitosa.');
        client.release();
    } catch (err) {
        console.error('❌ Error de conexión inicial del Pool a PostgreSQL:', err); // Este es el log que viste
        // Ya no debería aparecer con el fix de SSL
    }
}

testDbConnection();

module.exports = pool;