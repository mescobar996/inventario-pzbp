require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize, initDefaultData } = require('./config/database');
const authRoutes = require('./routes/auth');
const destinosRoutes = require('./routes/destinos');
const equiposRoutes = require('./routes/equipos');
const historialRoutes = require('./routes/historial');
const dashboardRoutes = require('./routes/dashboard');
const uploadRoutes = require('./routes/upload');
const seedRoutes = require('./routes/seed');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del build de React en producción
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
}

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/destinos', destinosRoutes);
app.use('/api/equipos', equiposRoutes);
app.use('/api/historial', historialRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/seed', seedRoutes);

// Ruta para servir React en producción
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Iniciar servidor
async function startServer() {
  try {
    // Sincronizar base de datos
    await sequelize.sync({ alter: false });
    console.log('✓ Base de datos sincronizada');
    
    // Inicializar datos por defecto
    await initDefaultData();
    
    app.listen(PORT, () => {
      console.log(`✓ Servidor corriendo en puerto ${PORT}`);
      console.log(`✓ Ambiente: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('✗ Error al iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
