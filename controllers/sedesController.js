const { client } = require("../utils/db"); // Importa cliente de base de datos

// Helper para manejo de errores
const handleDbError = (error, res, action = "procesar la solicitud") => {
  console.error(`Error al ${action}:`, error);
  res.status(500).json({
    success: false,
    error: "Error interno del servidor",
    details: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
};

// ===== OBTENER TODAS LAS SEDES =====
exports.obtenerTodasSedes = async (req, res) => {
  try {
    const query = `  
        SELECT id_sede AS id, nombre_sede AS nombre, 
        direccion AS direccion 
        FROM sede;
      `;

    const result = await client.query(query);

    console.log("Filas obtenidas de la base de datos:", result.rows);

    res.json(result.rows);

    /*const sedesConDireccion = result.rows.map((row) => ({
      id: row.id_sede,
      nombre: row.nombre_sede,
      direccion: row.direccion,
    }));*/
  } catch (error) {
    handleDbError(error, res, "obtener las sedes");
  }
};

// ===== OBTENER UNA SEDE POR ID =====
exports.obtenerSedePorId = async (req, res) => {
  const sedeId = req.params.id;

  if (!/^\d+$/.test(sedeId)) {
    return res.status(400).json({
      success: false,
      error: "ID de sede no válido",
    });
  }

  try {
    const result = await client.query(
      `
            SELECT id_sede, nombre_sede, direccion
            FROM Sede
            WHERE id_sede = $1
        `,
      [sedeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Sede con ID ${sedeId} no encontrada`,
      });
    }

    res.json(result.rows[0]); // Envía directamente el objeto de la sede
  } catch (error) {
    handleDbError(error, res, `obtener la sede con ID ${sedeId}`);
  }
};

// ===== CREAR UNA SEDE =====
exports.crearSede = async (req, res) => {
  const { nombre_sede, direccion } = req.body;

  if (!nombre_sede || !direccion) {
    return res.status(400).json({
      success: false,
      error: "Nombre y dirección son campos requeridos",
    });
  }

  try {
    const result = await client.query(
      `
            INSERT INTO Sede (nombre_sede, direccion)
            VALUES ($1, $2)
            RETURNING id_sede, nombre_sede, direccion
        `,
      [nombre_sede, direccion]
    );

    res.status(201).json(result.rows[0]); // Envía directamente el objeto de la sede creada
  } catch (error) {
    if (error.code === "23505") {
      // Violación de unique constraint
      return res.status(409).json({
        success: false,
        error: "Ya existe una sede con ese nombre",
      });
    }
    handleDbError(error, res, "crear la sede");
  }
};

// ===== ACTUALIZAR UNA SEDE =====
exports.actualizarSede = async (req, res) => {
  const sedeId = req.params.id;
  const { nombre_sede, direccion } = req.body;

  if (!/^\d+$/.test(sedeId)) {
    return res.status(400).json({
      success: false,
      error: "ID de sede no válido",
    });
  }

  if (!nombre_sede || !direccion) {
    return res.status(400).json({
      success: false,
      error: "Nombre y dirección son campos requeridos",
    });
  }

  try {
    const result = await client.query(
      `
            UPDATE Sede
            SET nombre_sede = $1,
                direccion = $2
            WHERE id_sede = $3
            RETURNING id_sede, nombre_sede, direccion
        `,
      [nombre_sede, direccion, sedeId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: `Sede con ID ${sedeId} no encontrada`,
      });
    }

    res.json(result.rows[0]); // Envía directamente el objeto de la sede actualizada
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        error: "Ya existe una sede con ese nombre",
      });
    }
    handleDbError(error, res, `actualizar la sede con ID ${sedeId}`);
  }
};

// ===== ELIMINAR UNA SEDE =====
exports.eliminarSede = async (req, res) => {
  const sedeId = req.params.id;

  if (!/^\d+$/.test(sedeId)) {
    return res.status(400).json({
      success: false,
      error: "ID de sede no válido",
    });
  }

  try {
    const result = await client.query(
      `
            DELETE FROM Sede
            WHERE id_sede = $1
        `,
      [sedeId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: `Sede con ID ${sedeId} no encontrada`,
      });
    }

    res.json({
      success: true,
      message: `Sede con ID ${sedeId} eliminada correctamente`,
    });
  } catch (error) {
    if (error.code === "23503") {
      // Violación de foreign key
      return res.status(409).json({
        success: false,
        error: "No se puede eliminar la sede porque tiene registros asociados",
      });
    }
    handleDbError(error, res, `eliminar la sede con ID ${sedeId}`);
  }
};
