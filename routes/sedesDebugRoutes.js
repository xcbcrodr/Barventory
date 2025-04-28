const express = require('express');
const router = express.Router();
const { client } = require('../utils/db'); // Asegúrate de que la ruta sea correcta

router.get('/sedes-test', async (req, res) => {
  try {
    const result = await client.query(`
      SELECT id_sede AS id, nombre_sede AS nombre, direccion
      FROM sede
    `);
    console.log("Resultado directo de DB:", result.rows); // Verifica esto en la consola del servidor
    res.json(result.rows);
  } catch (error) {
    console.error("Error en /debug/sedes-test:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;