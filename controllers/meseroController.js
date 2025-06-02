const client = require('../utils/db'); 

exports.getMesasPorSede = async (req, res) => {
    try {
        const idSedeMesero = req.user.idsede;
        console.log("DEBUG MESERO_CONTROLLER: Valor de idSedeMesero (mesas):", idSedeMesero);
        console.log("DEBUG MESERO_CONTROLLER: Tipo de idSedeMesero (mesas):", typeof idSedeMesero);

        if (!idSedeMesero || isNaN(parseInt(idSedeMesero))) {
            console.error('Error: idSedeMesero es inválido o no proporcionado en getMesasPorSede.');
            return res.status(400).json({ error: 'No se pudo determinar la sede del mesero para cargar las mesas. Reautentique.' });
        }

        const query = 'SELECT id_mesa AS id, numero_mesa AS nombre FROM mesa WHERE idsede = $1::integer';
        const values = [idSedeMesero];
        console.log("DEBUG MESERO_CONTROLLER: Consulta SQL para mesas:", query, "con valores:", values);
        const result = await client.query(query, values); // <--- DEBE USAR 'client.query()'
        console.log("DEBUG MESERO_CONTROLLER: Resultado RAW de mesas (con filtro):", result.rows);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener mesas por sede:', error); // <--- Este log es CRÍTICO
        res.status(500).json({ error: 'Error interno del servidor al cargar mesas' });
    }
};

exports.getProductosPorSede = async (req, res) => {
    try {
        const idSedeMesero = req.user.idsede;
        console.log("DEBUG MESERO_CONTROLLER: Valor de idSedeMesero (productos):", idSedeMesero);
        console.log("DEBUG MESERO_CONTROLLER: Tipo de idSedeMesero (productos):", typeof idSedeMesero);

        if (!idSedeMesero || isNaN(parseInt(idSedeMesero))) {
            console.error('Error: idSedeMesero es inválido o no proporcionado en getProductosPorSede.');
            return res.status(400).json({ error: 'No se pudo determinar la sede del mesero para cargar los productos. Reautentique.' });
        }

        const query = `
            SELECT
                id_producto AS id,
                nombre_producto AS nombre,
                precio_venta AS precio,
                cantidad
            FROM
                producto
            WHERE
                idsede = $1::integer`;
        const values = [idSedeMesero];
        console.log("DEBUG MESERO_CONTROLLER: Consulta SQL para productos:", query, "con valores:", values);
        // Usamos 'pool' directamente para consultas simples
        
        const result = await client.query(query, values);
        console.log("DEBUG MESERO_CONTROLLER: Resultado RAW de productos (con filtro):", result.rows);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener productos por sede:', error);
        res.status(500).json({ error: 'Error interno del servidor al cargar productos' });
    }
};

exports.registrarPedido = async (req, res) => {
    try {
        const { idMesa, productos } = req.body;
        const idSedeMesero = req.user.idsede;

        console.log('DEBUG MESERO_CONTROLLER: Pedido recibido para la mesa:', idMesa, 'Productos:', productos);
        console.log('DEBUG MESERO_CONTROLLER: Mesero de sede:', idSedeMesero);

        await client.query('BEGIN'); 

        let totalPedido = 0; 

        // Paso 1: Verificar stock y calcular total ANTES de cualquier inserción/actualización
        for (const item of productos) {
            // FOR UPDATE bloquea la fila en la DB para que otro proceso no la modifique
            const stockCheck = await client.query('SELECT cantidad, precio_venta FROM producto WHERE id_producto = $1 AND idsede = $2 FOR UPDATE', [item.idProducto, idSedeMesero]); 
            if (stockCheck.rows.length === 0) {
                throw new Error(`Producto con ID ${item.idProducto} no encontrado o no pertenece a esta sede.`);
            }
            if (stockCheck.rows[0].cantidad < item.cantidad) {
                throw new Error(`Stock insuficiente para el producto: ${item.idProducto}. Disponible: ${stockCheck.rows[0].cantidad}, Solicitado: ${item.cantidad}`);
            }
            totalPedido += parseFloat(stockCheck.rows[0].precio_venta) * item.cantidad;
        }

        // Paso 2: Insertar el encabezado del pedido
        const pedidoInsertQuery = 'INSERT INTO pedido(id_mesa, idsede, fecha_pedido, total_pedido) VALUES($1, $2, NOW(), $3) RETURNING id_pedido';
        const pedidoResult = await client.query(pedidoInsertQuery, [idMesa, idSedeMesero, totalPedido]);
        const idPedido = pedidoResult.rows[0].id_pedido;

        // Paso 3: Insertar los detalles del pedido y actualizar el stock
        for (const item of productos) {
            const detalleInsertQuery = 'INSERT INTO detalle_pedido(id_pedido, id_producto, cantidad, precio_unitario) VALUES($1, $2, $3, $4)';
            const updateStockQuery = 'UPDATE producto SET cantidad = cantidad - $1 WHERE id_producto = $2 AND idsede = $3';

            const productoPrecioData = await client.query('SELECT precio_venta FROM producto WHERE id_producto = $1', [item.idProducto]); 
            const precioUnitario = parseFloat(productoPrecioData.rows[0].precio_venta);

            await client.query(detalleInsertQuery, [idPedido, item.idProducto, item.cantidad, precioUnitario]);
            await client.query(updateStockQuery, [item.cantidad, item.idProducto, idSedeMesero]);
        }

        // **ELIMINAR ESTA SECCIÓN POR AHORA:**
        // Paso 4: Actualizar el estado de la mesa a OCUPADA (NO NECESARIO POR AHORA)
        // const updateMesaStatusQuery = 'UPDATE mesa SET ocupada = TRUE WHERE id_mesa = $1 AND idsede = $2';
        // await client.query(updateMesaStatusQuery, [idMesa, idSedeMesero]);

        // --- FIN DE LA TRANSACCIÓN (si todo fue exitoso) ---
        await client.query('COMMIT');
        res.status(201).json({ message: 'Pedido registrado exitosamente', idPedido: idPedido });

    } catch (error) {
        // --- MANEJO DE ERROR (revertir la transacción) ---
        await client.query('ROLLBACK'); 
        console.error('Error al registrar pedido en el backend:', error);
        if (error.message.includes('Stock insuficiente') || error.message.includes('no encontrado')) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Error interno del servidor al registrar el pedido.' });
    } finally {
        // NO LLAMES A client.release() AQUÍ. El cliente global no se libera.
    }
};

module.exports = exports;