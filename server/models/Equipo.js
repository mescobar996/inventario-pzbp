const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Equipo = sequelize.define('Equipo', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    n_orden: {
      type: DataTypes.STRING(50)
    },
    n_inventario: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    catalogo: {
      type: DataTypes.STRING(100)
    },
    ns_serial: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    gebipa: {
      type: DataTypes.STRING(50)
    },
    tipo_equipo: {
      type: DataTypes.ENUM('Equipo', 'Batería', 'Base Cargadora'),
      defaultValue: 'Equipo'
    },
    destino_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'destinos',
        key: 'id'
      }
    },
    observaciones: {
      type: DataTypes.TEXT
    },
    estado: {
      type: DataTypes.ENUM('Activo', 'Inactivo', 'Mantenimiento', 'Dado de Baja'),
      defaultValue: 'Activo'
    },
    fecha_alta: {
      type: DataTypes.DATEONLY,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'equipos',
    timestamps: true,
    indexes: [
      { fields: ['ns_serial'] },
      { fields: ['n_inventario'] },
      { fields: ['destino_id'] },
      { fields: ['tipo_equipo'] }
    ]
  });

  return Equipo;
};
