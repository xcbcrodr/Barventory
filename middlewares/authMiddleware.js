const jwt = require("jsonwebtoken");
<<<<<<< HEAD
const { client } = require("../utils/db");
=======
const client = require("../utils/db"); // Importación directa (sin llaves)
>>>>>>> develop

const authenticateToken = async (req, res, next) => {
  // Elimina completamente la sobreescritura de res.json
  try {
    const authHeader = req.headers["authorization"];
<<<<<<< HEAD
    const token = authHeader && authHeader.split(" ")[1]; // Espera el token como Bearer <token>

    if (!token) return res.status(401).json({ error: "Token no proporcionado" });

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "tu_secreto_seguro"
    );
=======
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) return res.status(401).json({ error: "Token no proporcionado" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "tu_secreto_seguro");
>>>>>>> develop

    const userResult = await client.query(
      `SELECT u.id_usuario, u.identificacion, u.nombre, u.email, r.nombre_rol 
       FROM usuario u
       INNER JOIN rol r ON u.idrol = r.id_rol
       WHERE u.id_usuario = $1`,
      [decoded.id]
    );

    if (userResult.rows.length === 0) return res.sendStatus(403);

<<<<<<< HEAD
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
=======
    req.user = userResult.rows[0]; // Mantenemos la estructura directa de la DB
>>>>>>> develop
    next();
  } catch (err) {
    console.error("Error en autenticación:", err);
    return res.sendStatus(403);
  }
};

const checkRole = (roles) => {
  return (req, res, next) => {
<<<<<<< HEAD
    const userRole = req.user.rol;
    if (!roles.includes(userRole)) {
      return res
        .status(403)
        .json({ error: "Acceso no autorizado para este rol" });
=======
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ error: "Acceso no autorizado para este rol" });
>>>>>>> develop
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  checkRole,
<<<<<<< HEAD
};
=======
};
>>>>>>> develop
