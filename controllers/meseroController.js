// controllers/meseroController.js
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
        const result = await client.query(query, values);
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
        
        // ¡CORRECCIÓN CLAVE! Usamos 'cantidad' en lugar de 'cantidad_disponible'
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
        const result = await client.query(query, values);
        console.log("DEBUG MESERO_CONTROLLER: Resultado RAW de productos (con filtro):", result.rows);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener productos por sede:', error);
        res.status(500).json({ error: 'Error interno del servidor al cargar productos' });
    }
};

exports.registrarPedido = async (req, res) => {
    const client = await require('../utils/db'); // Asume que client es un pool o una conexión ya abierta
    const dbClient = await client.connect(); // Obtener una conexión del pool

    try {
        const { idMesa, productos } = req.body;
        const idSedeMesero = req.user.idsede; // Asegúrate de que este dato sigue siendo accesible y válido

        console.log('DEBUG MESERO_CONTROLLER: Pedido recibido para la mesa:', idMesa, 'Productos:', productos);
        console.log('DEBUG MESERO_CONTROLLER: Mesero de sede:', idSedeMesero);

        await dbClient.query('BEGIN'); // Iniciar una transacción para asegurar la integridad

        // 1. Insertar el encabezado del pedido (ej. en una tabla 'pedido')
        const pedidoInsertQuery = 'INSERT INTO pedido(id_mesa, idsede, fecha_pedido, total) VALUES($1, $2, NOW(), $3) RETURNING id_pedido';
        let totalPedido = 0; // Calcularemos el total
        
        // Antes de insertar el encabezado, verifica stock y calcula el total
        for (const item of productos) {
            const stockCheck = await dbClient.query('SELECT cantidad, precio_venta FROM producto WHERE id_producto = $1 AND idsede = $2 FOR UPDATE', [item.idProducto, idSedeMesero]);
            if (stockCheck.rows.length === 0 || stockCheck.rows[0].cantidad < item.cantidad) {
                throw new Error(`Stock insuficiente para el producto ID ${item.idProducto} o producto no encontrado en la sede.`);
            }
            totalPedido += parseFloat(stockCheck.rows[0].precio_venta) * item.cantidad;
        }

        const pedidoResult = await dbClient.query(pedidoInsertQuery, [idMesa, idSedeMesero, totalPedido]);
        const idPedido = pedidoResult.rows[0].id_pedido;

        // 2. Insertar los detalles del pedido (ej. en una tabla 'detalle_pedido') y actualizar stock
        for (const item of productos) {
            const detalleInsertQuery = 'INSERT INTO detalle_pedido(id_pedido, id_producto, cantidad, precio_unitario) VALUES($1, $2, $3, $4)';
            const updateStockQuery = 'UPDATE producto SET cantidad = cantidad - $1 WHERE id_producto = $2 AND idsede = $3';

            const productoData = await dbClient.query('SELECT precio_venta FROM producto WHERE id_producto = $1', [item.idProducto]);
            const precioUnitario = parseFloat(productoData.rows[0].precio_venta);

            await dbClient.query(detalleInsertQuery, [idPedido, item.idProducto, item.cantidad, precioUnitario]);
            await dbClient.query(updateStockQuery, [item.cantidad, item.idProducto, idSedeMesero]);
        }

        await dbClient.query('COMMIT'); // Confirmar la transacción
        res.json({ message: 'Pedido registrado exitosamente', idPedido: idPedido });

    } catch (error) {
        await dbClient.query('ROLLBACK'); // Revertir la transacción si algo falla
        console.error('Error al registrar pedido en el backend:', error);
        res.status(500).json({ error: `Error interno del servidor al registrar el pedido: ${error.message}` });
    } finally {
        dbClient.release(); // Liberar la conexión al pool
    }
};

module.exports = exports;