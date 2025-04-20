// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const { client } = require('../utils/db');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.sendStatus(401);

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_secreto_seguro');
    
    // Verificar si el usuario aún existe en la base de datos
    const user = await client.query(
      'SELECT id_usuario, identificacion, nombre, email FROM Usuario WHERE id_usuario = $1',
      [decoded.id]
    );

    if (user.rows.length === 0) return res.sendStatus(403);

    req.user = user.rows[0];
    console.log(req.user)
    next();
  } catch (err) {
    console.error('Error en autenticación:', err);
    return res.sendStatus(403);
  }
};

const checkRole = (roles) => {
  return (req, res, next) => {
    const userRole = req.user.rol;
    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: 'Acceso no autorizado para este rol' });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  checkRole
};