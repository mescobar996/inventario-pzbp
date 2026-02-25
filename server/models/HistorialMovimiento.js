const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const HistorialMovimiento = sequelize.define('HistorialMovimiento', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    equipo_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'equipos',
        key: 'id'
      }
    },
    n_inventario: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    ns_serial: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    destino_origen_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'destinos',
        key: 'id'
      }
    },
    destino_origen_nombre: {
      type: DataTypes.STRING(50)
    },
    destino_nuevo_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'destinos',
        key: 'id'
      }
    },
    destino_nuevo_nombre: {
      type: DataTypes.STRING(50)
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'usuarios',
        key: 'id'
      }
    },
    usuario_nombre: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    tipo_movimiento: {
      type: DataTypes.ENUM('Alta', 'Traslado', 'Cambio Estado', 'Baja'),
      allowNull: false
    },
    observaciones: {
      type: DataTypes.TEXT
    },
    fecha_movimiento: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'historial_movimientos',
    timestamps: false,
    indexes: [
      { fields: ['equipo_id'] },
      { fields: ['fecha_movimiento'] },
      { fields: ['usuario_id'] }
    ]
  });

  return HistorialMovimiento;
};
