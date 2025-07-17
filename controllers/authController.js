const client = require("../utils/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt"); // Importación de bcrypt

const JWT_SECRET = process.env.JWT_SECRET || "tu_secreto_seguro";

exports.login = async (req, res) => {
    const { identificacion, password } = req.body;
    console.log('*** Inicio de la función login ***');
    console.log('Identificacion recibida en la API:', identificacion);
    // console.log('Password recibido en la API:', password); // POR SEGURIDAD, NO LOGUEAR EN PRODUCCIÓN
    try {
        const userResult = await client.query('SELECT id_usuario, identificacion, nombre, email, contrasenia, idrol, idsede FROM usuario WHERE identificacion = $1', [identificacion]);
        const user = userResult.rows[0];

        if (!user) {
            console.log('Usuario NO encontrado en la base de datos para la identificación:', identificacion);
            return res.status(400).json({ error: 'Credenciales inválidas.' });
        }
        console.log('Usuario ENCONTRADO. Identificación del usuario en DB:', user.identificacion);
        // console.log('Contraseña de la DB para este usuario:', user.contrasenia); // POR SEGURIDAD, NO LOGUEAR EN PRODUCCIÓN

        // CAMBIO FINAL: Usar bcrypt.compare para verificar la contraseña hasheada
        const isMatch = await bcrypt.compare(password, user.contrasenia);
        console.log('Resultado de la comparación de contraseñas (isMatch):', isMatch);

        if (!isMatch) {
            console.log('Contraseña NO coincide para usuario con identificacion:', user.identificacion);
            return res.status(400).json({ error: 'Credenciales inválidas.' });
        }

        console.log('Login exitoso. Generando token...');
        console.log('ID de rol del usuario (user.idrol):', user.idrol);

        const roleResult = await client.query('SELECT nombre_rol FROM rol WHERE id_rol = $1', [user.idrol]);
        const roleName = roleResult.rows[0] ? roleResult.rows[0].nombre_rol : null;

        if (!roleName) {
            console.error(`Error: No se encontró nombre de rol para idrol: ${user.idrol}`);
            return res.status(500).json({ error: 'No se pudo determinar el rol del usuario.' });
        }

        const payload = {
            id: user.id_usuario,
            identificacion: user.identificacion,
            nombre: user.nombre,
            email: user.email,
            rol: roleName,
            idsede: user.idsede
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

        console.log('Contenido de la respuesta JSON enviada al frontend (sin token y datos sensibles):', {
            message: 'Autenticación exitosa',
            rol: roleName,
            nombreUsuario: user.nombre,
            idsede: user.idsede
        });

        res.json({
            message: 'Autenticación exitosa',
            token,
            rol: roleName,
            nombreUsuario: user.nombre,
            idsede: user.idsede
        });
    } catch (error) {
        console.error('*** ERROR CATCHED EN LOGIN:', error);
        res.status(500).json({ error: 'Error interno del servidor en el login.' });
    }
};

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

exports.getSedes = async (req, res) => {
    try {
        const query =
            "SELECT id_sede AS id, nombre_sede AS nombre, direccion AS direccion FROM sede";
        const result = await client.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error("Error al obtener sedes:", err);
        res
            .status(500)
            .json({ error: "Error interno del servidor al cargar sedes" });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const user = req.user;

        res.json({
            id: user.id,
            nombre: user.nombre,
            email: user.email,
            rol: user.rol,
            idsede: user.idsede,
        });
    } catch (err) {
        console.error("Error al obtener perfil:", err);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

const path = require("path");

exports.adminDashboard = (req, res) => {
    try {
        res.sendFile(path.join(__dirname, "../public/admin/dashboardAdmin.html"));
    } catch (err) {
        console.error("Error al cargar el dashboard (admin):", err);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

exports.cashierDashboard = async (req, res) => {
    try {
        res.json({
            message: "Bienvenido al panel de cajero",
            data: {
                ventasPendientes: 5,
                totalVendidoHoy: 1200000,
            },
        });
    } catch (err) {
        console.error("Error en dashboard cajero:", err);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

module.exports = exports;