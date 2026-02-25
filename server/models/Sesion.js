const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Sesion = sequelize.define('Sesion', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'usuarios',
        key: 'id'
      }
    },
    token: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    ip_address: {
      type: DataTypes.STRING(45)
    },
    user_agent: {
      type: DataTypes.TEXT
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    tableName: 'sesiones',
    timestamps: true
  });

  return Sesion;
};
