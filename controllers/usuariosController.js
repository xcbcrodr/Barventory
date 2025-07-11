const user = require("../utils/db");

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
    const result = await user.query(
      `SELECT
                u.id_usuario AS id,
                u.nombre AS nombre,
                r.nombre_rol AS rol,
                s.nombre_sede AS sede,
                u.identificacion AS identificacion,
                u.email AS email,
                u.contrasenia AS contrasenia,
                u.idrol AS idrol,
                u.idsede AS idsede
            FROM usuario u
            INNER JOIN rol r ON u.idrol = r.id_rol
            INNER JOIN sede s ON u.idsede = s.id_sede`
    );

    console.log(
      "Datos de usuarios enviados al frontend:",
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
                      WHERE u.id_usuario = ${usuarioId}`;

      console.log("Consulta a ejecutar:", queryText);

      const result = await user.query(queryText);

      if (result.rows.length > 0) {
          res.json({ success: true, data: result.rows[0] }); // Enviar respuesta exitosa
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
        "Nombre , identificacion, email, contraseña, sede y rol son campos requeridos",
    });
  }

  try {
    const result = await user.query(
      `
                INSERT INTO Usuario (nombre, identificacion, email, contrasenia, idrol, idsede)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id_usuario, nombre, identificacion, email, contrasenia, idrol, idsede
            `,
      [nombre, identificacion, email, contrasenia, rol, sede]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        error: "Ya existe un usuario con ese nombre",
      });
    }
    handleDbError(error, res, "crear el usuario");
  }
};

exports.actualizarUsuario = async (req, res) => {
  const usuarioId = req.params.id;
  const { nombre, identificacion, email, contrasenia, rol, sede } = req.body;

  if (!validateNumericId(usuarioId, res)) return;

  if (!nombre || !identificacion || !email || !contrasenia || !sede || !rol) {
    return res.status(400).json({
      success: false,
      error: "Todos los campos son requeridos",
    });
  }

  try {
    const result = await user.query(
      `
                UPDATE Usuario
                SET nombre = $1,
                    identificacion = $2,
                    email = $3,
                    contrasenia = $4,
                    idrol = $5,
                    idsede = $6
                WHERE id_usuario = $7
                RETURNING id_usuario, nombre, identificacion, email, contrasenia, idrol, idsede
            `,
      [nombre, identificacion, email, contrasenia, rol, sede, usuarioId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: `Usuario con ID ${usuarioId} no encontrado`,
      });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        error: "Ya existe un usuario con ese nombre",
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
      if (error.code === "23503") {
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
