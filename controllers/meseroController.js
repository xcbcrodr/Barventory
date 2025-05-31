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
    try {
        const { idMesa, productos } = req.body; 
        console.log('DEBUG MESERO_CONTROLLER: Pedido recibido para la mesa:', idMesa, 'Productos:', productos);
        
        // Aquí iría la lógica para insertar el pedido en la base de datos
        // ... (Tu implementación para pedidos) ...

        res.json({ message: 'Pedido registrado exitosamente' }); 
    } catch (error) {
        console.error('Error al registrar pedido:', error);
        res.status(500).json({ error: 'Error interno del servidor al registrar el pedido' });
    }
};

module.exports = exports;