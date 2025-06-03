const pool = require('../utils/db'); 

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
        const result = await pool.query(query, values); // CAMBIO: Usar pool.query()
        console.log("DEBUG MESERO_CONTROLLER: Resultado RAW de mesas (con filtro):", result.rows);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener mesas por sede:', error);
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
        const result = await pool.query(query, values); // CAMBIO: Usar pool.query()
        console.log("DEBUG MESERO_CONTROLLER: Resultado RAW de productos (con filtro):", result.rows);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener productos por sede:', error);
        res.status(500).json({ error: 'Error interno del servidor al cargar productos' });
    }
};

exports.registrarPedido = async (req, res) => {
    console.log('--- INICIO: Procesando solicitud POST /auth/mesero/pedidos ---');
    console.log('Cuerpo de la solicitud (req.body):', req.body);
    const { idMesa, productos } = req.body;
    const idSedeMesero = req.user.idsede; // La variable idSedeMesero no lleva guion, pero la columna en DB sí (idsede)

    console.log('idMesa:', idMesa);
    console.log('productos:', productos);
    console.log('Mesero de sede:', idSedeMesero);

    if (!idMesa || !productos || !Array.isArray(productos) || productos.length === 0) {
        console.error('Error: Datos del pedido incompletos o inválidos.');
        return res.status(400).json({ error: 'Datos del pedido incompletos o inválidos.' });
    }
    if (!idSedeMesero || isNaN(parseInt(idSedeMesero))) {
        console.error('Error: idSedeMesero es inválido o no proporcionado.');
        return res.status(400).json({ error: 'No se pudo determinar la sede del mesero para registrar el pedido. Reautentique.' });
    }

    let clientConnection; // Esta variable contendrá la conexión específica del pool

    try {
        // *** IMPORTANTE: Obtener una conexión dedicada del pool para la transacción ***
        clientConnection = await pool.connect(); 
        await clientConnection.query('BEGIN'); // Iniciar transacción en esta conexión específica

        let totalPedido = 0;

        console.log('Verificando stock y calculando total');
        for (const item of productos) {
            
            const stockCheck = await clientConnection.query(
                'SELECT cantidad, precio_venta, nombre_producto FROM producto WHERE id_producto = $1 AND idsede = $2 FOR UPDATE', 
                [item.idProducto, idSedeMesero]
            );

            if (stockCheck.rows.length === 0) {
                console.error(`Error: Producto con ID ${item.idProducto} no encontrado o no pertenece a esta sede.`);
                throw new Error(`Producto con ID ${item.idProducto} no encontrado o no pertenece a esta sede.`);
            }
            const cantidadEnStock = stockCheck.rows[0].cantidad;
            const precioUnitarioDB = parseFloat(stockCheck.rows[0].precio_venta); 

            if (cantidadEnStock < item.cantidad) {
                console.error(`Stock insuficiente para el producto ${item.idProducto} (${stockCheck.rows[0].nombre_producto}). Disponible: ${cantidadEnStock}, Solicitado: ${item.cantidad}`);
                throw new Error(`Stock insuficiente para el producto ${stockCheck.rows[0].nombre_producto}. Disponible: ${cantidadEnStock}, Solicitado: ${item.cantidad}`);
            }
            totalPedido += precioUnitarioDB * item.cantidad;
        }
        console.log('Stock verificado y total calculado:', totalPedido);

        // Paso 2: Insertar el encabezado del pedido
        console.log('Insertando encabezado del pedido...');
        const pedidoInsertQuery = 'INSERT INTO pedido(idmesa, idsede, fecha_pedido, total_pedido) VALUES($1, $2, NOW(), $3) RETURNING id_pedido';
        const pedidoResult = await clientConnection.query(pedidoInsertQuery, [idMesa, idSedeMesero, totalPedido]);
        const idPedido = pedidoResult.rows[0].id_pedido; // Recuperamos id_pedido (PK, con guion)
        console.log('Encabezado del pedido insertado con ID:', idPedido);

        
        console.log('Insertando detalles del pedido y actualizando stock...');
        for (const item of productos) {
            
            const detalleInsertQuery = 'INSERT INTO detalle_pedido(idpedido, idproducto, cantidad, precioUnitario) VALUES($1, $2, $3, $4)';
            const updateStockQuery = 'UPDATE producto SET cantidad = cantidad - $1 WHERE id_producto = $2 AND idsede = $3';

            const productoPrecioData = await clientConnection.query('SELECT precio_venta FROM producto WHERE id_producto = $1', [item.idProducto]);
            const precioUnitario = parseFloat(productoPrecioData.rows[0].precio_venta);

            console.log(`Insertando detalle para pedido ${idPedido}, producto ${item.idProducto}, cantidad ${item.cantidad}, precio unitario ${precioUnitario}`);
            await clientConnection.query(detalleInsertQuery, [idPedido, item.idProducto, item.cantidad, precioUnitario]);
            
            console.log(`Actualizando stock para producto ${item.idProducto}: -${item.cantidad}`);
            await clientConnection.query(updateStockQuery, [item.cantidad, item.idProducto, idSedeMesero]);
        }

        await clientConnection.query('COMMIT'); 
        console.log('Transacción de pedido completada con éxito.');
        res.status(201).json({ message: 'Pedido registrado exitosamente', idPedido: idPedido });

    } catch (error) {
        if (clientConnection) { 
            await clientConnection.query('ROLLBACK'); 
            console.warn('Transacción de pedido revertida debido a un error.');
        }
        console.error('Error al registrar pedido en el backend:', error);
        if (error.message.includes('Stock insuficiente') || error.message.includes('no encontrado')) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Error interno del servidor al registrar el pedido.' });
    } finally {
        if (clientConnection) { 
            clientConnection.release(); 
            console.log('Conexión a la DB liberada.');
        }
        console.log('--- FIN: Procesando solicitud POST /auth/mesero/pedidos ---');
    }
};

module.exports = exports;