const client = require("../utils/db"); 

const handleDbError = (error, res, action = "procesar la solicitud") => {
  console.error(`Error al ${action}:`, error);
  res.status(500).json({
    success: false,
    error: "Error interno del servidor",
    details: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
};

// Helper para validar IDs numéricos (sin cambios)
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

// ===== OBTENER TODOS LOS PRODUCTOS =====
exports.obtenerTodosProductos = async (req, res) => {
  try {
    const result = await client.query(
      `SELECT
    p.id_producto AS id,
    p.nombre_producto AS nombre_p,
    p.precio_producto AS precio_p,
    p.precio_venta AS precio_v,
    p.cantidad AS cantidad_p,
    p.proveedor AS proveedor_p,
    s.nombre_sede AS nombre_sede
FROM producto p
LEFT JOIN sede s ON p.idsede = s.id_sede;
      `
    );

    console.log("--> obtenerTodosProductos: Respuesta JSON enviada al frontend:");
    console.log(JSON.stringify({ success: true, data: result.rows }, null, 2));
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("--> obtenerTodosProductos: ¡ERROR!", error);
    console.error("--> obtenerTodosProductos: Detalles del error:", error.message, error.stack);
    handleDbError(error, res, "obtener todos los productos");
  }
};

// ===== OBTENER UN PRODUCTO POR ID =====
exports.obtenerProductoPorId = async (req, res) => {
  const productoId = req.params.id;
  if (!validateNumericId(productoId, res)) return;

  try {
      const queryText = `SELECT
    p.id_producto AS id,
    p.nombre_producto AS nombre_p,
    p.precio_producto AS precio_p,
    p.precio_venta AS precio_v,
    p.cantidad AS cantidad_p,
    p.proveedor AS proveedor_p,
    p.idsede AS id_sede, 
    s.nombre_sede AS nombre_sede
FROM producto p
INNER JOIN sede s ON p.idsede = s.id_sede
WHERE p.id_producto = ${productoId}`;

      console.log("Consulta a ejecutar:", queryText);

      const result = await client.query(queryText);

      if (result.rows.length > 0) {
          res.json({ success: true, data: result.rows[0] }); // Enviar respuesta exitosa
      } else {
          res
              .status(404)
              .json({
                  success: false,
                  error: `Producto con ID ${productoId} no encontrado`,
              });
      }
  } catch (error) {
      handleDbError(error, res, `obtener el producto con ID ${productoId}`);
  }
};

// ===== CREAR UN PRODUCTO ===== (Sin cambios relevantes para la consulta)
exports.crearProducto = async (req, res) => {
  const { nombre_p, precio_p, precio_v, cantidad_p, proveedor_p, sede} = req.body;
  console.log("--> crearProducto: Datos recibidos:", req.body);

  if (!nombre_p || !precio_p || !precio_v || !cantidad_p || !proveedor_p || !sede) {
    console.log("--> crearProducto: Campos requeridos faltantes");
    return res.status(400).json({
      success: false,
      error: "Todos los campos son requeridos",
    });
  }

  try {
    const query = `
  INSERT INTO Producto (nombre_producto, precio_producto, precio_venta, cantidad, proveedor, idsede)
  VALUES ($1, $2, $3, $4, $5, $6)
  RETURNING id_producto, nombre_producto, precio_producto, precio_venta, cantidad, proveedor, idsede
`;
const values = [nombre_p, precio_p, precio_v, cantidad_p, proveedor_p, sede];
    console.log("--> crearProducto: Consulta SQL:", query, values);
    const result = await client.query(query, values);
    console.log("--> crearProducto: Resultado de la consulta:", result);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("--> crearProducto: ¡ERROR!", error);
    console.error("--> crearProducto: Detalles del error:", error.message, error.stack);
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        error: "Ya existe un producto con ese nombre",
      });
    }
    handleDbError(error, res, "crear el producto");
  }
};

// ===== ACTUALIZAR UN PRODUCTO =====
exports.actualizarProducto = async (req, res) => {
  const productoId = req.params.id;
  const { nombre_p, precio_p, precio_v, cantidad_p, proveedor_p, sede } = req.body;

  if (!validateNumericId(productoId, res)) return;

  try {
      const updates = {};
      const values = [];
      let paramCount = 1;

      if (nombre_p !== undefined) {
          updates.nombre_producto = `$${paramCount++}`;
          values.push(nombre_p);
      }
      if (precio_p !== undefined) {
          updates.precio_producto = `$${paramCount++}`;
          values.push(precio_p);
      }
      if (precio_v !== undefined) {
          updates.precio_venta = `$${paramCount++}`;
          values.push(precio_v);
      }
      if (cantidad_p !== undefined) {
          updates.cantidad = `$${paramCount++}`;
          values.push(cantidad_p);
      }
      if (proveedor_p !== undefined) {
          updates.proveedor = `$${paramCount++}`;
          values.push(proveedor_p);
      }
      if (sede !== undefined) {
          updates.idsede = `$${paramCount++}`;
          values.push(sede);
      }

      if (Object.keys(updates).length === 0) {
          return res.status(400).json({
              success: false,
              error: "No se proporcionaron campos para actualizar",
          });
      }

      const setClause = Object.entries(updates)
          .map(([key, value]) => `${key} = ${value}`)
          .join(", ");

      const query = `
          UPDATE Producto
          SET ${setClause}
          WHERE id_producto = $${paramCount}
          RETURNING id_producto AS id, nombre_producto AS nombre_p, precio_producto AS precio_p, precio_venta AS precio_v, cantidad AS cantidad_p, proveedor AS proveedor_p, idsede AS sede
      `;

      values.push(productoId);
      const result = await client.query(query, values);

      if (result.rowCount === 0) {
          return res.status(404).json({
              success: false,
              error: `Producto con ID ${productoId} no encontrado`,
          });
      }

      res.json({ success: true, data: result.rows[0] });

  } catch (error) {
      if (error.code === "23505") {
          return res.status(409).json({
              success: false,
              error: "Ya existe un producto con ese nombre",
          });
      }
      handleDbError(error, res, `actualizar el producto con ID ${productoId}`);
  }
};

// ===== ELIMINAR UN PRODUCTO ===== (Sin cambios relevantes para la consulta)
exports.eliminarProducto = async (req, res) => {
  const productoId = req.params.id;
  if (!validateNumericId(productoId, res)) return;

  try {
    const result = await client.query(
      `
              DELETE FROM Producto
              WHERE id_producto = $1
          `,
      [productoId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: `Producto con ID ${productoId} no encontrado`,
      });
    }

    res.json({
      success: true,
      message: `Producto con ID ${productoId} eliminado correctamente`,
    });
  } catch (error) {
    if (error.code === "23503") {
      return res.status(409).json({
        success: false,
        error:
          "No se puede eliminar el producto porque tiene registros asociados",
      });
    }
    handleDbError(error, res, `eliminar el producto con ID ${productoId}`);
  }
};

/*
exports.obtenerRoles = async (req, res) => {
  try {
    const rolesResult = await client.query("SELECT id_rol, nombre_rol FROM rol");
    res.json({ success: true, data: rolesResult.rows });
  } catch (error) {
    handleDbError(error, res, "obtener los roles");
  }
};
*/

exports.obtenerSedes = async (req, res) => {
  try {
    const sedesResult = await client.query(
      "SELECT id_sede, nombre_sede FROM sede"
    );
    res.json({ success: true, data: sedesResult.rows });
  } catch (error) {
    handleDbError(error, res, "obtener las sedes");
  }
};
