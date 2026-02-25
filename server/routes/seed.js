const express = require('express');
const bcrypt = require('bcryptjs');
const { sequelize, Usuario, Destino } = require('../config/database');

const router = express.Router();

// POST /api/seed - Inicializar base de datos con datos por defecto
router.post('/', async (req, res) => {
  try {
    // Sincronizar base de datos
    await sequelize.sync({ force: true });
    console.log('Base de datos sincronizada');

    // Crear usuarios por defecto
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    const usuarios = await Usuario.bulkCreate([
      {
        username: 'admin',
        password_hash: passwordHash,
        email: 'admin@inventario.com',
        rol: 'admin',
        nombre_completo: 'Administrador del Sistema'
      },
      {
        username: 'observador',
        password_hash: passwordHash,
        email: 'observador@inventario.com',
        rol: 'observador',
        nombre_completo: 'Usuario Observador'
      }
    ]);

    console.log('Usuarios creados:', usuarios.length);

    // Crear destinos por defecto
    const destinosData = [
      { nombre: 'PZBP', codigo: 'PZBP', descripcion: 'Destino PZBP', color: '#3B82F6' },
      { nombre: 'SLOR', codigo: 'SLOR', descripcion: 'Destino SLOR', color: '#10B981' },
      { nombre: 'ROSA', codigo: 'ROSA', descripcion: 'Destino ROSA', color: '#F59E0B' },
      { nombre: 'SAFE', codigo: 'SAFE', descripcion: 'Destino SAFE', color: '#EF4444' },
      { nombre: 'OSRO', codigo: 'OSRO', descripcion: 'Destino OSRO', color: '#8B5CF6' },
      { nombre: 'PARA', codigo: 'PARA', descripcion: 'Destino PARA', color: '#EC4899' },
      { nombre: 'SNIC', codigo: 'SNIC', descripcion: 'Destino SNIC', color: '#06B6D4' },
      { nombre: 'VCON', codigo: 'VCON', descripcion: 'Destino VCON', color: '#84CC16' },
      { nombre: 'RLLO', codigo: 'RLLO', descripcion: 'Destino RLLO', color: '#F97316' },
      { nombre: 'ASEC', codigo: 'ASEC', descripcion: 'Destino ASEC', color: '#6366F1' },
      { nombre: 'GCSM', codigo: 'GCSM', descripcion: 'Destino GCSM', color: '#14B8A6' },
      { nombre: 'DIAM', codigo: 'DIAM', descripcion: 'Destino DIAM', color: '#A855F7' }
    ];

    const destinos = await Destino.bulkCreate(destinosData);
    console.log('Destinos creados:', destinos.length);

    res.json({
      message: 'Base de datos inicializada correctamente',
      usuarios: usuarios.map(u => ({ username: u.username, rol: u.rol })),
      destinos: destinos.map(d => ({ nombre: d.nombre, codigo: d.codigo }))
    });
  } catch (error) {
    console.error('Error al inicializar base de datos:', error);
    res.status(500).json({ error: 'Error al inicializar base de datos' });
  }
});

module.exports = router;
