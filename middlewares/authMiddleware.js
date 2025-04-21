const jwt = require("jsonwebtoken");
const { client } = require("../utils/db");

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Espera el token como Bearer <token>

    if (!token) return res.status(401).json({ error: "Token no proporcionado" });

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "tu_secreto_seguro"
    );

    const userResult = await client.query(
      `SELECT u.id_usuario, u.identificacion, u.nombre, u.email, r.nombre_rol 
       FROM usuario u
       INNER JOIN rol r ON u.idrol = r.id_rol
       WHERE u.id_usuario = $1`,
      [decoded.id]
    );

    if (userResult.rows.length === 0) return res.sendStatus(403);

    const user = userResult.rows[0];
    // Responsable de verificar el token JWT, decodificarlo y obtener datos del usuario desde base de datos se confirma que si debe estar aqui
    req.user = {
      id: user.id_usuario,
      identificacion: user.identificacion,
      nombre: user.nombre,
      email: user.email,
      rol: user.nombre_rol, // Esto es importante para el middleware checkRole
    };

    console.log("Usuario autenticado:", req.user);
    next();
  } catch (err) {
    console.error("Error en autenticación:", err);
    return res.sendStatus(403);
  }
};

const checkRole = (roles) => {
  return (req, res, next) => {
    const userRole = req.user.rol;
    if (!roles.includes(userRole)) {
      return res
        .status(403)
        .json({ error: "Acceso no autorizado para este rol" });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  checkRole,
};
