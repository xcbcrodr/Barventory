const user = require("../utils/db");
const bcrypt = require("bcrypt"); // Importación de bcrypt

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

exports.obtenerTodosUsuarios = async (req, res) => {
    try {
        // RECOMENDACIÓN DE SEGURIDAD: No obtener la columna 'contrasenia' en consultas para todos los usuarios.
        const result = await user.query(
            `SELECT
                u.id_usuario AS id,
                u.nombre AS nombre,
                r.nombre_rol AS rol,
                s.nombre_sede AS sede,
                u.identificacion AS identificacion,
                u.email AS email,
                -- u.contrasenia AS contrasenia, -- COMENTAR/ELIMINAR esta línea por seguridad
                u.idrol AS idrol,
                u.idsede AS idsede
            FROM usuario u
            INNER JOIN rol r ON u.idrol = r.id_rol
            INNER JOIN sede s ON u.idsede = s.id_sede`
        );

        console.log(
            "Datos de usuarios enviados al frontend (sin contraseñas):",
            JSON.stringify(result.rows, null, 2)
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        handleDbError(error, res, "obtener todos los usuarios");
    }
};

exports.obtenerUsuarioPorId = async (req, res) => {
    const usuarioId = req.params.id;
    if (!validateNumericId(usuarioId, res)) return;

    try {
        const queryText = `SELECT
                            u.id_usuario,
                            u.nombre,
                            u.identificacion,
                            u.email,
                            u.contrasenia,
                            u.idrol,
                            r.nombre_rol AS rol,
                            u.idsede,
                            s.nombre_sede AS sede
                        FROM usuario u
                        INNER JOIN rol r ON u.idrol = r.id_rol
                        INNER JOIN sede s ON u.idsede = s.id_sede
                        WHERE u.id_usuario = $1`; // Usar $1 para prevenir inyección SQL

        console.log("Consulta a ejecutar para usuario por ID:", queryText);

        const result = await user.query(queryText, [usuarioId]); // Pasar el parámetro

        if (result.rows.length > 0) {
            res.json({ success: true, data: result.rows[0] });
        } else {
            res.status(404).json({ success: false, error: `Usuario con ID ${usuarioId} no encontrado` });
        }
    } catch (error) {
        handleDbError(error, res, `obtener el usuario con ID ${usuarioId}`);
    }
};

exports.crearUsuario = async (req, res) => {
    const { nombre, identificacion, email, contrasenia, sede, rol } = req.body;

    if (!nombre || !identificacion || !email || !contrasenia || !sede || !rol) {
        return res.status(400).json({
            success: false,
            error:
                "Nombre, identificacion, email, contraseña, sede y rol son campos requeridos",
        });
    }

    try {
        // CAMBIO FINAL: Hashear la contraseña antes de guardarla
        const hashedPassword = await bcrypt.hash(contrasenia, 10); // 10 es el número de 'salt rounds'

        const result = await user.query(
            `
                INSERT INTO Usuario (nombre, identificacion, email, contrasenia, idrol, idsede)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id_usuario, nombre, identificacion, email, idrol, idsede
            `, // No devolver la contraseña hasheada en la respuesta
            [nombre, identificacion, email, hashedPassword, rol, sede] // Usar la contraseña hasheada
        );

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        if (error.code === "23505") { // Error de unicidad
            // Determinar qué campo duplicado causó el error (requiere constraints en DB)
            if (error.constraint === 'usuario_identificacion_key') { // Asumiendo que existe esta constraint
                return res.status(409).json({
                    success: false,
                    error: "Ya existe un usuario con esa identificación.",
                });
            }
            if (error.constraint === 'usuario_email_key') { // Asumiendo que existe esta constraint
                return res.status(409).json({
                    success: false,
                    error: "Ya existe un usuario con ese email.",
                });
            }
            // Fallback si no es una de las constraints específicas conocidas
            return res.status(409).json({
                success: false,
                error: "Ya existe un usuario con un dato duplicado.",
            });
        }
        handleDbError(error, res, "crear el usuario");
    }
};

exports.actualizarUsuario = async (req, res) => {
    const usuarioId = req.params.id;
    const { nombre, identificacion, email, contrasenia, rol, sede } = req.body;

    if (!validateNumericId(usuarioId, res)) return;

    if (!nombre || !identificacion || !email || !sede || !rol) {
        // La contraseña ya no es obligatoria para actualizar si no se va a cambiar
        return res.status(400).json({
            success: false,
            error: "Nombre, identificacion, email, sede y rol son campos requeridos",
        });
    }

    let queryText = `
        UPDATE Usuario
        SET nombre = $1,
            identificacion = $2,
            email = $3,
            idrol = $4,
            idsede = $5
        WHERE id_usuario = $6
        RETURNING id_usuario, nombre, identificacion, email, idrol, idsede
    `;
    let queryParams = [nombre, identificacion, email, rol, sede, usuarioId];

    if (contrasenia) {
        // CAMBIO FINAL: Hashear la nueva contraseña si se proporciona
        const hashedPassword = await bcrypt.hash(contrasenia, 10);
        queryText = `
            UPDATE Usuario
            SET nombre = $1,
                identificacion = $2,
                email = $3,
                contrasenia = $7, -- Nuevo parámetro para la contraseña hasheada
                idrol = $4,
                idsede = $5
            WHERE id_usuario = $6
            RETURNING id_usuario, nombre, identificacion, email, idrol, idsede
        `;
        queryParams = [nombre, identificacion, email, rol, sede, usuarioId, hashedPassword]; // Añadir contraseña hasheada
    }

    try {
        const result = await user.query(queryText, queryParams);

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                error: `Usuario con ID ${usuarioId} no encontrado`,
            });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        if (error.code === "23505") { // Error de unicidad
            // Determinar qué campo duplicado causó el error
            if (error.constraint === 'usuario_identificacion_key') {
                return res.status(409).json({
                    success: false,
                    error: "Ya existe un usuario con esa identificación.",
                });
            }
            if (error.constraint === 'usuario_email_key') {
                return res.status(409).json({
                    success: false,
                    error: "Ya existe un usuario con ese email.",
                });
            }
            return res.status(409).json({
                success: false,
                error: "Ya existe un usuario con un dato duplicado.",
            });
        }
        handleDbError(error, res, `actualizar el usuario con ID ${usuarioId}`);
    }
};

exports.eliminarUsuario = async (req, res) => {
    const usuarioId = req.params.id;
    if (!validateNumericId(usuarioId, res)) return;

    try {
        const result = await user.query(
            `
                DELETE FROM Usuario
                WHERE id_usuario = $1
            `,
            [usuarioId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                error: `Usuario con ID ${usuarioId} no encontrado`,
            });
        }

        res.json({
            success: true,
            message: `Usuario con ID ${usuarioId} eliminado correctamente`,
        });
    } catch (error) {
        if (error.code === "23503") { // Foreign key violation
            return res.status(409).json({
                success: false,
                error: "No se puede eliminar el usuario porque tiene registros asociados",
            });
        }
        handleDbError(error, res, `eliminar el usuario con ID ${usuarioId}`);
    }
};

exports.obtenerRoles = async (req, res) => {
    try {
        const rolesResult = await user.query("SELECT id_rol, nombre_rol FROM rol");
        res.json({ success: true, data: rolesResult.rows });
    } catch (error) {
        handleDbError(error, res, "obtener los roles");
    }
};

exports.obtenerSedes = async (req, res) => {
    try {
        const sedesResult = await user.query(
            "SELECT id_sede, nombre_sede FROM sede"
        );
        res.json({ success: true, data: sedesResult.rows });
    } catch (error) {
        handleDbError(error, res, "obtener las sedes");
    }
};