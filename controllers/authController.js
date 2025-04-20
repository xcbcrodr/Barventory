// controllers/authController.js
const client = require("../utils/db");
const jwt = require("jsonwebtoken");

// Configuración JWT (debes tener esto en tus variables de entorno)
const JWT_SECRET = process.env.JWT_SECRET || "tu_secreto_seguro";

// Función para obtener roles
exports.getRoles = async (req, res) => {
  try {
    const query = "SELECT id_rol AS id, nombre_rol AS nombre FROM rol";
    const result = await client.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener roles:", err);
    res
      .status(500)
      .json({ error: "Error interno del servidor al cargar roles" });
  }
};

// Función para obtener sedes
exports.getSedes = async (req, res) => {
  try {
    const query = "SELECT id_sede AS id, nombre_sede AS nombre FROM sede";
    const result = await client.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener sedes:", err);
    res
      .status(500)
      .json({ error: "Error interno del servidor al cargar sedes" });
  }
};

// Función para obtener perfil de usuario (protegida)
exports.getProfile = async (req, res) => {
  try {
    // El middleware authenticateToken ya verificó el token y añadió req.user
    const user = req.user;

    res.json({
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      sede: user.sede,
    });
  } catch (err) {
    console.error("Error al obtener perfil:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Dashboard de administrador (protegido + checkRole)
exports.adminDashboard = async (req, res) => {
  try {
    // Solo accesible para administradores (el middleware checkRole ya verificó esto)
    res.json({
      message: "Bienvenido al panel de administración",
      data: {
        usuariosRegistrados: 150,
        ventasHoy: 42,
      },
    });
  } catch (err) {
    console.error("Error en dashboard admin:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Dashboard de cajero (protegido + checkRole)
exports.cashierDashboard = async (req, res) => {
  try {
    // Solo accesible para cajeros
    res.json({
      message: "Bienvenido al panel de cajero",
      data: {
        ventasPendientes: 5, // Ejemplo
        totalVendidoHoy: 1200000,
      },
    });
  } catch (err) {
    console.error("Error en dashboard cajero:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

/*Dashboard de mesero (protegido + checkRole)
exports.waitressDashboard = async (req, res) => {
  try {
    // Solo accesible para meseros
    res.json({
      message: 'Bienvenido al panel de mesero',
      data: {
        mesasAtendidas: 5
      }
    });
  } catch (err) {
    console.error('Error en dashboard mesero:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
*/

// Función para login
exports.login = async (req, res) => {
  const { username, password, rol, sede } = req.body;

  try {
    const queryText = `
    SELECT
        u.id_usuario,
        u.identificacion,
        u.nombre,
        u.email,
        r.nombre_rol,
        s.nombre_sede
    FROM
        usuario u
    INNER JOIN
        rol r ON u.idrol = r.id_rol
    INNER JOIN
        sede s ON u.idsede = s.id_sede
    WHERE
        u.identificacion = $1
        AND u.contrasenia = $2
        AND u.idrol = $3
        AND u.idsede = $4
`;

    const values = [username, password, rol, sede];

    const result = await client.query(queryText, values);

    if (result.rows.length > 0) {
      const user = result.rows[0];

      // Generar token JWT
      const token = jwt.sign(
        {
          id: user.id_usuario,
          nombre: user.nombre,
          email: user.email,
          rol: user.nombre_rol,
          sede: user.nombre_sede,
        },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.json({
        success: true,
        token,
        user: {
          id: user.id_usuario,
          nombre: user.nombre,
          rol: user.nombre_rol,
          sede: user.nombre_sede,
        },
        redirectUrl: `/${user.nombre_rol.toLowerCase()}/dashboardAdmin.html`,
      });
    } else {
      res.status(401).json({ error: "Credenciales incorrectas" });
    }
  } catch (error) {
    console.error("Error en login:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};
