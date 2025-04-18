const db = require('../utils/db');

async function getRoles(req, res) {
  try {
    const result = await db.query("SELECT nombre FROM rol");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener roles' });
  }
}

async function getSedes(req, res) {
  try {
    const result = await db.query("SELECT nombre FROM sede");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener sedes' });
  }
}

module.exports = { getRoles, getSedes };
