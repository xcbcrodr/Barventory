const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.on('error', (err) => {
    console.error('❌ Error inesperado en el pool de PostgreSQL:', err);
});

(async () => {
    try {
        const client = await pool.connect();
        console.log('🎉 Conexión a PostgreSQL exitosa');
        client.release();
    } catch (err) {
        console.error('❌ No se pudo conectar a PostgreSQL:', err);
    }
})();

module.exports = pool;
