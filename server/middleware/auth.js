const jwt = require('jsonwebtoken');
const { Usuario } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'inventario-pzbp-secret-key-2024';

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token de acceso requerido' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const usuario = await Usuario.findByPk(decoded.id);

    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: 'Usuario no válido o inactivo' });
    }

    req.usuario = usuario;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.usuario.rol !== 'admin') {
    return res.status(403).json({ 
      error: 'Acceso denegado. Se requiere rol de administrador.' 
    });
  }
  next();
};

const requireObservador = (req, res, next) => {
  if (!['admin', 'observador'].includes(req.usuario.rol)) {
    return res.status(403).json({ 
      error: 'Acceso denegado. Rol no autorizado.' 
    });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireObservador,
  JWT_SECRET
};
