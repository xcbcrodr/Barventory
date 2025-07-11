const client = require("../utils/db");

const handleDbError = (error, res, action = "procesar la solicitud") => {
    console.error(`Error al ${action}:`, error);
    res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
};

const validateNumericId = (id, res) => {
    if (!/^\d+$/.test(id)) {
        res.status(400).json({
            success: false,
            error: "ID no válido",
        });
        return false;
    }
    return true;
};

exports.obtenerTodasSedes = async (req, res) => {
    try {
        const result = await client.query(
            "SELECT id_sede AS id, nombre_sede AS nombre, direccion AS direccion FROM sede"
        );

        const responseData = result.rows.map(row => ({
            id: row.id,
            nombre: row.nombre,
            direccion: row.direccion
        }));

        console.log("--> obtenerTodasSedes: Datos enviados al frontend:", JSON.stringify(responseData, null, 2));

        res.json({ success: true, data: responseData });
    } catch (error) {
        handleDbError(error, res, "obtener todas las sedes");
    }
};

exports.obtenerSedePorId = async (req, res) => {
    const sedeId = req.params.id;
    if (!validateNumericId(sedeId, res)) return;

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

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        handleDbError(error, res, `obtener la sede con ID ${sedeId}`);
    }
};

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

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                error: "Ya existe una sede con ese nombre",
            });
        }
        handleDbError(error, res, "crear la sede");
    }
};

exports.actualizarSede = async (req, res) => {
    const sedeId = req.params.id;
    const { nombre_sede, direccion } = req.body;

    if (!validateNumericId(sedeId, res)) return;

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

        res.json({ success: true, data: result.rows[0] });
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

exports.eliminarSede = async (req, res) => {
    const sedeId = req.params.id;
    if (!validateNumericId(sedeId, res)) return;

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
            return res.status(409).json({
                success: false,
                error:
                    "No se puede eliminar la sede porque tiene registros asociados",
            });
        }
        handleDbError(error, res, `eliminar la sede con ID ${sedeId}`);
    }
};