const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Configuración de la base de datos
const dbPath = path.join(__dirname, '../../database/inventario.db');
const dbDir = path.dirname(dbPath);

// Crear directorio si no existe
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  // Configuración de.pool para SQLite
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Modelos
const Usuario = require('../models/Usuario')(sequelize);
const Destino = require('../models/Destino')(sequelize);
const Equipo = require('../models/Equipo')(sequelize);
const HistorialMovimiento = require('../models/HistorialMovimiento')(sequelize);
const Sesion = require('../models/Sesion')(sequelize);

// Associations
Usuario.hasMany(Sesion, { foreignKey: 'usuario_id', as: 'sesiones' });
Sesion.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

Destino.hasMany(Equipo, { foreignKey: 'destino_id', as: 'equipos' });
Equipo.belongsTo(Destino, { foreignKey: 'destino_id', as: 'destino' });

Equipo.hasMany(HistorialMovimiento, { foreignKey: 'equipo_id', as: 'historial' });
HistorialMovimiento.belongsTo(Equipo, { foreignKey: 'equipo_id', as: 'equipo' });

Destino.hasMany(HistorialMovimiento, { foreignKey: 'destino_origen_id', as: 'movimientosOrigen' });
Destino.hasMany(HistorialMovimiento, { foreignKey: 'destino_nuevo_id', as: 'movimientosNuevo' });

Usuario.hasMany(HistorialMovimiento, { foreignKey: 'usuario_id', as: 'movimientos' });
HistorialMovimiento.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

module.exports = {
  sequelize,
  Usuario,
  Destino,
  Equipo,
  HistorialMovimiento,
  Sesion,
  initDefaultData
};

// Función para inicializar datos por defecto
async function initDefaultData() {
  const bcrypt = require('bcryptjs');
  
  // Verificar si ya existen usuarios
  const userCount = await Usuario.count();
  if (userCount > 0) {
    console.log('Los datos por defecto ya existen');
    return;
  }

  console.log('Creando datos por defecto...');
  
  // Crear usuarios por defecto
  const passwordHash = await bcrypt.hash('admin123', 10);
  
  await Usuario.bulkCreate([
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

  await Destino.bulkCreate(destinosData);
  
  console.log('Datos por defecto creados correctamente');
}
