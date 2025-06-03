const client = require("../utils/db");

// Este log debería aparecer al iniciar el servidor si el archivo se carga
console.log('--- [DEBUG] cajeroController.js cargado ---');

const cajeroController = {
  /**
   * Obtiene las mesas que tienen pedidos pendientes en la sede del cajero.
   * @param {Object} req - Objeto de solicitud de Express.
   * @param {Object} res - Objeto de respuesta de Express.
   */
  getMesasConPedidosPendientes: async (req, res) => {
    console.log("--- [DEBUG] INICIO: Ejecutando getMesasConPedidosPendientes ---");
    console.log("[DEBUG] req.user en getMesasConPedidosPendientes:", req.user);
    const idSede = req.user && req.user.idsede;
    console.log("[DEBUG] idSede obtenido para consulta de mesas:", idSede);

    if (!idSede) {
      console.error(
        "[ERROR] ID de sede no proporcionado o inválido desde el token en getMesasConPedidosPendientes."
      );
      return res
        .status(400)
        .json({ error: "ID de sede no proporcionado o inválido." });
    }

    try {
      const query = `
                SELECT
                    m.id_mesa AS id,
                    m.numero_mesa AS nombre,
                    p.id_pedido AS "idPedidoActual"
                FROM
                    mesa m
                JOIN
                    pedido p ON m.id_mesa = p.idmesa
                WHERE
                    m.idsede = $1 AND p.estado_pago = 'PENDIENTE';
            `;
      console.log(
        "[DEBUG] Consulta SQL para getMesasConPedidosPendientes:",
        query
      );
      console.log(
        "[DEBUG] Parámetros para getMesasConPedidosPendientes:",
        [idSede]
      );
      const { rows } = await client.query(query, [idSede]);

      console.log(
        "[DEBUG] Mesas con pedidos pendientes encontradas:",
        rows.length,
        "mesas.",
        rows
      );
      res.status(200).json(rows);
    } catch (error) {
      console.error(
        "[ERROR] En getMesasConPedidosPendientes (capturado):",
        error
      );
      console.error(
        "[ERROR] DETALLE DEL ERROR DE BASE DE DATOS (getMesasConPedidosPendientes):",
        error.message,
        error.stack
      );
      res.status(500).json({ error: "Error interno del servidor al obtener mesas." });
    }
  },

  /**
   * Obtiene el detalle de un pedido específico para ser visualizado por el cajero.
   * @param {Object} req - Objeto de solicitud de Express (req.params.id para idPedido).
   * @param {Object} res - Objeto de respuesta de Express.
   */
  getDetallePedidoParaCajero: async (req, res) => {
    console.log("--- [DEBUG] INICIO: Ejecutando getDetallePedidoParaCajero ---");
    const idPedido = parseInt(req.params.id);
    const idSedeCajero = req.user.idsede;

    if (isNaN(idPedido)) {
      console.error(
        "[ERROR] ID de pedido inválido o no proporcionado (NaN) en getDetallePedidoParaCajero."
      );
      return res.status(400).json({ error: "ID de pedido inválido." });
    }
    if (!idSedeCajero) {
      console.error(
        "[ERROR] idSedeCajero es inválido o no proporcionado en getDetallePedidoParaCajero."
      );
      return res.status(400).json({
        error: "No se pudo determinar la sede del cajero. Reautentique.",
      });
    }

    try {
      const pedidoQuery = `
                SELECT
                    id_pedido,
                    idmesa AS idMesa,
                    idsede AS idSede,
                    total_pedido,
                    estado_pago
                FROM
                    pedido
                WHERE
                    id_pedido = $1 AND idsede = $2 AND estado_pago = 'PENDIENTE';
            `;
      console.log(
        "[DEBUG] Consulta SQL (getDetallePedidoParaCajero):",
        pedidoQuery
      );
      console.log("[DEBUG] Parámetros (getDetallePedidoParaCajero):", [
        idPedido,
        idSedeCajero,
      ]);
      const pedidoResult = await client.query(pedidoQuery, [
        idPedido,
        idSedeCajero,
      ]);

      if (pedidoResult.rows.length === 0) {
        console.warn(
          `[WARN] Pedido ID ${idPedido} no encontrado, no está pendiente o no pertenece a la sede ${idSedeCajero}.`
        );
        return res
          .status(404)
          .json({
            error: "Pedido no encontrado, ya pagado o no pertenece a esta sede.",
          });
      }

      const pedido = pedidoResult.rows[0];

      const detallePedidoQuery = `
                SELECT
                    dp.id_detalle_pedido,
                    dp.idproducto AS idProducto,
                    prod.nombre_producto AS nombreProducto,
                    dp.cantidad,
                    dp.precioUnitario AS precioUnitario,
                    (dp.cantidad * dp.precioUnitario) AS subtotal
                FROM
                    detalle_pedido dp
                INNER JOIN
                    producto prod ON dp.idproducto = prod.id_producto
                WHERE
                    dp.id_pedido = $1;
            `;
      console.log(
        "[DEBUG] Consulta SQL (detallePedido):",
        detallePedidoQuery
      );
      console.log("[DEBUG] Parámetros (detallePedido):", [idPedido]);
      const detalleResult = await client.query(detallePedidoQuery, [idPedido]);

      console.log(
        "[DEBUG] Detalles del pedido encontrados:",
        detalleResult.rows.length,
        "ítems.",
        detalleResult.rows
      );

      res.json({
        idPedido: pedido.id_pedido,
        idMesa: pedido.idMesa,
        totalPedido: parseFloat(pedido.total_pedido),
        productos: detalleResult.rows,
      });
    } catch (error) {
      console.error(
        "[ERROR] Al obtener los detalles del pedido para el cajero (capturado):",
        error
      );
      console.error(
        "[ERROR] DETALLE DEL ERROR DE BASE DE DATOS (getDetallePedidoParaCajero):",
        error.message,
        error.stack
      );
      res.status(500).json({
        error: "Error interno del servidor al cargar los detalles del pedido.",
      });
    }
  },

  /**
   * Obtiene la lista de métodos de pago activos.
   * @param {Object} req - Objeto de solicitud de Express.
   * @param {Object} res - Objeto de respuesta de Express.
   */
  getMetodosPago: async (req, res) => {
    console.log("--- [DEBUG] INICIO: Ejecutando getMetodosPago ---");
    try {
      const query =
        "SELECT id_metodo_pago AS id, nombre_metodo AS nombre FROM metodo_pago WHERE activo = TRUE ORDER BY nombre_metodo";
      console.log("[DEBUG] Consulta SQL (getMetodosPago):", query);
      const result = await client.query(query);

      console.log(
        "[DEBUG] Métodos de pago encontrados:",
        result.rows.length,
        "métodos.",
        result.rows
      );
      res.json(result.rows);
    } catch (error) {
      console.error("[ERROR] Al obtener métodos de pago (capturado):", error);
      console.error(
        "[ERROR] DETALLE DEL ERROR DE BASE DE DATOS (getMetodosPago):",
        error.message,
        error.stack
      );
      res.status(500).json({
        error: "Error interno del servidor al cargar los métodos de pago.",
      });
    }
  },

  /**
   * Procesa el pago de un pedido, registra los pagos y actualiza el estado del pedido.
   * Implementa una transacción para asegurar la atomicidad.
   * @param {Object} req - Objeto de solicitud de Express (req.body para idPedido y pagos).
   * @param {Object} res - Objeto de respuesta de Express.
   */
  procesarPago: async (req, res) => {
    console.log(
      "--- [DEBUG] INICIO: Procesando solicitud POST /cajero/procesar-pago ---"
    );
    console.log("[DEBUG] Cuerpo de la solicitud (req.body):", req.body);
    const { idPedido, pagos } = req.body;
    const idSedeCajero = req.user.idsede;

    if (
      !idPedido ||
      isNaN(parseInt(idPedido)) ||
      !pagos ||
      !Array.isArray(pagos) ||
      pagos.length === 0
    ) {
      console.error("[ERROR] Datos de pago incompletos o inválidos.");
      return res
        .status(400)
        .json({ error: "Datos de pago incompletos o inválidos." });
    }
    if (!idSedeCajero) {
      console.error(
        "[ERROR] idSedeCajero es inválido o no proporcionado en procesarPago."
      );
      return res.status(400).json({
        error: "No se pudo determinar la sede del cajero. Reautentique.",
      });
    }

    let clientConnection;

    try {
      clientConnection = await client.connect(); // Obtener una conexión del pool para la transacción
      await clientConnection.query("BEGIN");

      const pedidoCheckQuery = `
                SELECT total_pedido, estado_pago
                FROM pedido
                WHERE id_pedido = $1 AND idsede = $2 FOR UPDATE;
            `;
      console.log("[DEBUG] Consulta SQL (pedidoCheck):", pedidoCheckQuery);
      console.log("[DEBUG] Parámetros de consulta (pedidoCheck):", [
        idPedido,
        idSedeCajero,
      ]);
      const pedidoResult = await clientConnection.query(pedidoCheckQuery, [
        idPedido,
        idSedeCajero,
      ]);

      if (pedidoResult.rows.length === 0) {
        console.error(
          `[ERROR] Pedido ID ${idPedido} no encontrado o no pertenece a la sede ${idSedeCajero}.`
        );
        throw new Error("Pedido no encontrado o no pertenece a esta sede.");
      }

      const pedido = pedidoResult.rows[0];
      if (pedido.estado_pago !== "PENDIENTE") {
        console.error(
          `[ERROR] Pedido ID ${idPedido} ya no está PENDIENTE. Estado actual: ${pedido.estado_pago}.`
        );
        throw new Error(
          `El pedido ya ha sido procesado o no está en estado PENDIENTE.`
        );
      }

      const totalPedidoEsperado = parseFloat(pedido.total_pedido);
      let totalPagadoRecibido = 0;

      for (const pago of pagos) {
        if (
          !pago.idMetodoPago ||
          isNaN(parseInt(pago.idMetodoPago)) ||
          !pago.monto ||
          isNaN(parseFloat(pago.monto)) ||
          parseFloat(pago.monto) <= 0
        ) {
          throw new Error(
            "Datos de un método de pago individual incompletos o inválidos."
          );
        }
        const montoActual = parseFloat(pago.monto);
        totalPagadoRecibido += montoActual;

        const insertPagoQuery = `
                        INSERT INTO registro_pago (id_pedido, id_metodo_pago, monto, detalle_metodo_pago, referencia_transaccion)
                        VALUES ($1, $2, $3, $4, $5);
                    `;
        const insertPagoValues = [
          idPedido,
          pago.idMetodoPago,
          montoActual,
          pago.detalleMetodoPago || null,
          pago.referenciaTransaccion || null,
        ];
        console.log(
          "[DEBUG] Insertando registro_pago:",
          insertPagoValues
        );
        await clientConnection.query(insertPagoQuery, insertPagoValues);
      }

      if (totalPagadoRecibido < totalPedidoEsperado) {
        console.error(
          `[ERROR] Monto pagado (${totalPagadoRecibido}) es menor que el total del pedido (${totalPedidoEsperado}).`
        );
        throw new Error(
          `El monto pagado es insuficiente. Se esperaba un total de ${totalPedidoEsperado.toFixed(
            2
          )}.`
        );
      }

      const updatePedidoStatusQuery = `
                UPDATE pedido
                SET estado_pago = 'PAGADO'
                WHERE id_pedido = $1 AND idsede = $2;
            `;
      console.log(
        `[DEBUG] Actualizando estado del pedido ${idPedido} a 'PAGADO'.`
      );
      await clientConnection.query(updatePedidoStatusQuery, [
        idPedido,
        idSedeCajero,
      ]);

      await clientConnection.query("COMMIT");
      console.log(`[DEBUG] Pedido ID ${idPedido} procesado y pagado exitosamente.`);
      res.status(200).json({
        message: "Pago registrado exitosamente y pedido cerrado.",
        totalPagado: totalPagadoRecibido,
      });
    } catch (error) {
      if (clientConnection) {
        await clientConnection.query("ROLLBACK");
        console.warn("[WARN] Transacción de pago revertida debido a un error.");
      }
      console.error(
        "[ERROR] Al procesar el pago del pedido en el backend (capturado):",
        error
      );
      console.error(
        "[ERROR] DETALLE DEL ERROR DE BASE DE DATOS (procesarPago):",
        error.message,
        error.stack
      );
      res.status(500).json({
        error:
          error.message || "Error interno del servidor al procesar el pago.",
      });
    } finally {
      if (clientConnection) {
        clientConnection.release();
        console.log("[DEBUG] Conexión a la DB liberada.");
      }
      console.log(
        "--- [DEBUG] FIN: Procesando solicitud POST /cajero/procesar-pago ---"
      );
    }
  },
};

module.exports = cajeroController;