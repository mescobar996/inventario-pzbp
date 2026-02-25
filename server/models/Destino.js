const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Destino = sequelize.define('Destino', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    codigo: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true
    },
    descripcion: {
      type: DataTypes.TEXT
    },
    color: {
      type: DataTypes.STRING(7),
      defaultValue: '#3B82F6'
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'destinos',
    timestamps: true
  });

  return Destino;
};
