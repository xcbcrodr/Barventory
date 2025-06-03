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

exports.obtenerTodasMesas = async (req, res) => {
    try {
        const result = await client.query(
            "SELECT id_mesa AS id, numero_mesa AS numero, idsede FROM mesa"
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        handleDbError(error, res, "obtener todas las mesas");
    }
};

exports.obtenerMesasPorSede = async (req, res) => {
    const sedeId = req.params.id_sede;
    if (!validateNumericId(sedeId, res)) return;

    try {
        const result = await client.query(
            `
                SELECT id_mesa, numero_mesa
                FROM mesa
                WHERE idsede = $1
            `,
            [sedeId]
        );

        res.json({ success: true, data: result.rows });
    } catch (error) {
        handleDbError(error, res, `obtener las mesas para la sede con ID ${sedeId}`);
    }
};

exports.crearMesa = async (req, res) => {
    const sedeId = req.params.id_sede;
    const { numero_mesa } = req.body;

    if (!validateNumericId(sedeId, res)) return;
    if (!numero_mesa) {
        return res.status(400).json({
            success: false,
            error: "El número de mesa es un campo requerido",
        });
    }

    try {
        const result = await client.query(
            `
                INSERT INTO mesa (idsede, numero_mesa)
                VALUES ($1, $2)
                RETURNING id_mesa, numero_mesa, idsede
            `,
            [sedeId, numero_mesa]
        );

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                error: "Ya existe una mesa con ese número en esta sede",
            });
        }
        handleDbError(error, res, `crear la mesa para la sede con ID ${sedeId}`);
    }
};

exports.eliminarMesa = async (req, res) => {
    const mesaId = req.params.id_mesa;
    if (!validateNumericId(mesaId, res)) return;

    try {
        const result = await client.query(
            `
                DELETE FROM mesa
                WHERE id_mesa = $1
            `,
            [mesaId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                error: `Mesa con ID ${mesaId} no encontrada`,
            });
        }

        res.json({
            success: true,
            message: `Mesa con ID ${mesaId} eliminada correctamente`,
        });
    } catch (error) {
        handleDbError(error, res, `eliminar la mesa con ID ${mesaId}`);
    }
};

exports.obtenerSedes = async (req, res) => {
    try {
        const sedesResult = await client.query(
            "SELECT id_sede AS id, nombre_sede AS nombre FROM sede" 
        );
        res.json({ success: true, data: sedesResult.rows });
    } catch (error) {
        handleDbError(error, res, "obtener las sedes");
    }
};