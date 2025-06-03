// middlewares/authMiddleware.js
const jwt = require("jsonwebtoken");
const client = require("../utils/db");

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
            console.error("DEBUG AUTH: Token no proporcionado.");
            return res.status(401).json({ error: "Token no proporcionado." });
        }

        console.log("DEBUG AUTH: Token recibido:", token ? token.substring(0, 30) + '...' : 'No token'); 
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "tu_secreto_seguro"
        );

        console.log("DEBUG AUTH: Token decodificado (payload JWT):", decoded);
        console.log("DEBUG AUTH: Ejecutando consulta SQL para id_usuario:", decoded.id);
        const userResult = await client.query(
            `SELECT u.id_usuario, u.identificacion, u.nombre, u.email, r.nombre_rol, u.idsede
             FROM usuario u
             INNER JOIN rol r ON u.idrol = r.id_rol
             WHERE u.id_usuario = $1`,
            [decoded.id]
        );

        console.log("DEBUG AUTH: Resultado de la consulta SQL (userResult.rows):", userResult.rows);

        if (userResult.rows.length === 0) {
            console.error("DEBUG AUTH: Usuario no encontrado en la base de datos para el ID:", decoded.id);
            return res.status(403).json({ error: "Usuario no encontrado." });
        }

        const user = userResult.rows[0];
        console.log("DEBUG AUTH: Objeto 'user' de la BD antes de asignación a req.user:", user);

        req.user = {
            id: user.id_usuario,
            identificacion: user.identificacion,
            nombre: user.nombre,
            email: user.email,
            rol: user.nombre_rol, 
            idsede: user.idsede 
        };
        console.log("DEBUG AUTH: req.user final después de authenticateToken (con datos de BD):", req.user);

        next();
    } catch (err) {
        console.error("Error en authenticateToken:", err);
        if (err instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ error: "Token expirado." });
        } else if (err instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ error: "Token inválido." });
        } else {
            return res.status(500).json({ error: "Error interno del servidor en autenticación." });
        }
    }
};

const checkRole = (roles) => {
    return (req, res, next) => {
        console.log("DEBUG CHECKROLE: req.user al inicio de checkRole:", req.user);

        if (!req.user || !req.user.rol || typeof req.user.rol !== "string") {
            console.error("DEBUG CHECKROLE: Acceso denegado: req.user o su rol no está definido correctamente.");
            return res.status(403).json({ error: 'Acceso denegado. Rol de usuario no definido o inválido.' });
        }

        if (!Array.isArray(roles)) {
            roles = [roles];
        }

        if (roles.includes(req.user.rol)) {
            console.log(`DEBUG CHECKROLE: Rol '${req.user.rol}' permitido para acceder. Rol(es) requerido(s): ${roles.join(', ')}`);
            next();
        } else {
            console.warn(`DEBUG CHECKROLE: Acceso denegado para usuario con rol: '${req.user.rol}'. Rol(es) requerido(s): ${roles.join(', ')}`);
            res.status(403).json({ error: 'Acceso denegado. No tienes el rol necesario para esta acción.' });
        }
    };
};

module.exports = {
    authenticateToken,
    checkRole
};