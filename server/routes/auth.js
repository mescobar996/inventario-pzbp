const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Usuario, Sesion } = require('../config/database');
const { authenticateToken, requireAdmin, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    const usuario = await Usuario.findOne({ where: { username } });

    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const isValidPassword = await bcrypt.compare(password, usuario.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar token JWT
    const token = jwt.sign(
      { 
        id: usuario.id, 
        username: usuario.username, 
        rol: usuario.rol 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Guardar sesión
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
    await Sesion.create({
      usuario_id: usuario.id,
      token,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      expires_at: expiresAt
    });

    res.json({
      token,
      usuario: {
        id: usuario.id,
        username: usuario.username,
        email: usuario.email,
        rol: usuario.rol,
        nombre_completo: usuario.nombre_completo
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// Logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    await Sesion.destroy({ where: { token } });
    res.json({ message: 'Sesión cerrada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al cerrar sesión' });
  }
});

// Verificar token
router.get('/verify', authenticateToken, async (req, res) => {
  res.json({
    usuario: {
      id: req.usuario.id,
      username: req.usuario.username,
      email: req.usuario.email,
      rol: req.usuario.rol,
      nombre_completo: req.usuario.nombre_completo
    }
  });
});

// Cambiar contraseña (solo admin puede cambiar otras contraseñas)
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword, userId } = req.body;
    
    // Si no es admin, solo puede cambiar su propia contraseña
    let targetUser = req.usuario;
    if (req.usuario.rol === 'admin' && userId && userId !== req.usuario.id) {
      targetUser = await Usuario.findByPk(userId);
      if (!targetUser) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
    }

    // Verificar contraseña actual (solo si cambia su propia contraseña)
    if (userId === req.usuario.id || !userId) {
      const isValid = await bcrypt.compare(currentPassword, req.usuario.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'Contraseña actual incorrecta' });
      }
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await targetUser.update({ password_hash: passwordHash });

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al cambiar contraseña' });
  }
});

// Listar usuarios (solo admin)
router.get('/usuarios', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      attributes: ['id', 'username', 'email', 'rol', 'nombre_completo', 'activo', 'created_at'],
      order: [['created_at', 'DESC']]
    });
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar usuarios' });
  }
});

// Crear usuario (solo admin)
router.post('/usuarios', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { username, password, email, rol, nombre_completo } = req.body;

    const existingUser = await Usuario.findOne({ 
      where: { username: username } 
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'El nombre de usuario ya existe' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    const usuario = await Usuario.create({
      username,
      password_hash: passwordHash,
      email,
      rol: rol || 'observador',
      nombre_completo
    });

    res.status(201).json({
      id: usuario.id,
      username: usuario.username,
      email: usuario.email,
      rol: usuario.rol,
      nombre_completo: usuario.nombre_completo
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

// Eliminar usuario (solo admin)
router.delete('/usuarios/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.usuario.id) {
      return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
    }

    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    await usuario.update({ activo: false });
    res.json({ message: 'Usuario desactivado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

module.exports = router;
