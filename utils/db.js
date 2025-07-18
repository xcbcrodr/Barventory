const { Pool } = require('pg');
//require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT), 
    ssl: {
        rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 20
});

pool.on('error', (err, client) => {
    console.error('Error inesperado en el pool de clientes de PostgreSQL', err);
});

async function testDbConnection() {
    try {
        const client = await pool.connect();
        console.log('🎉 Conexión a la base de datos PostgreSQL exitosa.');
        client.release();
    } catch (err) {
        console.error('❌ Error de conexión inicial del Pool a PostgreSQL:', err); 
    }
}

testDbConnection();

module.exports = pool;
