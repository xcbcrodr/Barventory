const jwt = require("jsonwebtoken");
const client = require("../utils/db");
const user = require("../utils/db")
//const product = require("../utils/db")

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Token no proporcionado" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "tu_secreto_seguro"
    );
    console.log("authenticateToken - decoded.id:", decoded.id);

    const userResult = await client.query(
      `SELECT u.id_usuario, u.identificacion, u.nombre, u.email, r.nombre_rol
       FROM usuario u
       INNER JOIN rol r ON u.idrol = r.id_rol
       WHERE u.id_usuario = $1`,
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(403).json({ error: "Usuario no encontrado" });
    }

    const user = userResult.rows[0];
    req.user = {
      id: user.id_usuario,
      identificacion: user.identificacion,
      nombre: user.nombre,
      email: user.email,
      rol: user.nombre_rol,
    };

    /*
    const product = productResult.rows[0];
    req.product = {
      id: user.id_usuario,
      identificacion: user.identificacion,
      nombre: user.nombre,
      email: user.email,
      rol: user.nombre_rol,
    };
    */

    next();
  } catch (err) {
        console.error("Error en autenticación:", err);
        if (err instanceof jwt.TokenExpiredError) {
          return res.status(401).json({ error: "Token expirado" });
        } else if (err instanceof jwt.JsonWebTokenError) { // Añadida esta condición
          return res.status(401).json({ error: "Token inválido" });
        } else if (err instanceof Error) {
          console.error("Error de base de datos:", err);
          return res.status(403).json({ error: "Acceso no autorizado" });
        } else {
          console.error("Error inesperado en autenticación:", err);
          return res.status(500).json({ error: "Error interno del servidor" });
        }
      }
};

const checkRole = (roles) => {
  return (req, res, next) => {
      console.log("checkRole - req.user:", req.user); // Agrega esta línea
      if (
          !req.user ||
          typeof req.user !== "object" ||
          !req.user.rol ||
          typeof req.user.rol !== "string" ||
          !roles.includes(req.user.rol)
      ) {
          console.log("Acceso denegado por checkRole"); // Agrega esta línea
          return res
              .status(403)
              .json({ error: "Acceso no autorizado para este rol" });
      }
      next();
  };
};

module.exports = {
  authenticateToken,
  checkRole
};
