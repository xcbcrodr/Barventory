/*require('dotenv').config();
const { Client } = require('pg'); 
//const { user } = require('pg');

const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

client.connect()
  .then(() => console.log("✅ PostgreSQL conectado"))
  .catch(err => console.error("❌ Error de conexión a PostgreSQL:", err));

module.exports = client; */

// utils/db.js
require('dotenv').config();
const { Pool } = require('pg'); // CAMBIO: Importar Pool en lugar de Client

const pool = new Pool({ // CAMBIO: Crear una instancia de Pool
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    // Opcional: Configuración del pool para mejor rendimiento y manejo
    max: 10, // número máximo de clientes en el pool (valor por defecto es 10)
    idleTimeoutMillis: 30000, // tiempo en ms que un cliente puede estar inactivo antes de ser desconectado
    connectionTimeoutMillis: 2000, // tiempo en ms para intentar establecer una conexión antes de fallar
});

pool.on('error', (err) => { // Manejo de errores del pool (para errores de conexión o inactividad)
    console.error('❌ Error inesperado en el pool de PostgreSQL:', err);
});

// Opcional: Para verificar que el pool se conecta bien al inicio
pool.query('SELECT NOW()')
    .then(res => console.log("✅ PostgreSQL Pool conectado y listo (hora DB):", res.rows[0].now))
    .catch(err => console.error("❌ Error de conexión inicial del Pool a PostgreSQL:", err));

module.exports = pool; // CAMBIO: Exportar la instancia del Pool