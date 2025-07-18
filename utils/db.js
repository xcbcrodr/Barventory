const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 20
});

pool.on('error', (err) => {
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
