const express = require('express');
const { Op } = require('sequelize');
const { Equipo, Destino } = require('../config/database');
const { authenticateToken, requireObservador } = require('../middleware/auth');

const router = express.Router();

// GET - Dashboard principal
router.get('/', authenticateToken, requireObservador, async (req, res) => {
  try {
    // Contadores totales
    const totalEquipos = await Equipo.count({
      where: { estado: { [Op.ne]: 'Dado de Baja' } }
    });

    const totalBaterias = await Equipo.count({
      where: { 
        tipo_equipo: 'Batería',
        estado: { [Op.ne]: 'Dado de Baja' }
      }
    });

    const totalBases = await Equipo.count({
      where: { 
        tipo_equipo: 'Base Cargadora',
        estado: { [Op.ne]: 'Dado de Baja' }
      }
    });

    const totalRadios = await Equipo.count({
      where: { 
        tipo_equipo: 'Equipo',
        estado: { [Op.ne]: 'Dado de Baja' }
      }
    });

    // Distribución por destino
    const destinos = await Destino.findAll({
      where: { activo: true },
      order: [['nombre', 'ASC']]
    });

    const distribucionPorDestino = await Promise.all(
      destinos.map(async (destino) => {
        const counts = await Equipo.findAll({
          where: { 
            destino_id: destino.id,
            estado: { [Op.ne]: 'Dado de Baja' }
          },
          attributes: [
            'tipo_equipo',
            [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'cantidad']
          ],
          group: ['tipo_equipo'],
          raw: true
        });

        const radios = counts.find(c => c.tipo_equipo === 'Equipo')?.cantidad || 0;
        const baterias = counts.find(c => c.tipo_equipo === 'Batería')?.cantidad || 0;
        const bases = counts.find(c => c.tipo_equipo === 'Base Cargadora')?.cantidad || 0;

        return {
          id: destino.id,
          nombre: destino.nombre,
          codigo: destino.codigo,
          color: destino.color,
          cantidad: radios + baterias + bases,
          radios,
          baterias,
          bases
        };
      })
    );

    // Equipos por estado
    const porEstado = await Equipo.findAll({
      attributes: [
        'estado',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'cantidad']
      ],
      where: { estado: { [Op.ne]: 'Dado de Baja' } },
      group: ['estado'],
      raw: true
    });

    // Últimos movimientos (últimos 10)
    const { HistorialMovimiento } = require('../config/database');
    const ultimosMovimientos = await HistorialMovimiento.findAll({
      limit: 10,
      order: [['fecha_movimiento', 'DESC']],
      attributes: ['id', 'tipo_movimiento', 'n_inventario', 'ns_serial', 'destino_origen_nombre', 'destino_nuevo_nombre', 'usuario_nombre', 'fecha_movimiento']
    });

    res.json({
      contadores: {
        totalEquipos,
        totalBaterias,
        totalBases,
        totalRadios
      },
      distribucionPorDestino,
      porEstado,
      ultimosMovimientos
    });
  } catch (error) {
    console.error('Error en dashboard:', error);
    res.status(500).json({ error: 'Error al obtener datos del dashboard' });
  }
});

// GET - Gráfico de evolución temporal
router.get('/evolucion', authenticateToken, requireObservador, async (req, res) => {
  try {
    const { dias = 30 } = req.query;
    
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - parseInt(dias));

    const { HistorialMovimiento } = require('../config/database');
    
    const evolucion = await HistorialMovimiento.findAll({
      where: {
        fecha_movimiento: { [Op.gte]: fechaInicio }
      },
      attributes: [
        [require('sequelize').fn('DATE', require('sequelize').col('fecha_movimiento')), 'fecha'],
        'tipo_movimiento',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'cantidad']
      ],
      group: ['fecha', 'tipo_movimiento'],
      order: [['fecha', 'ASC']],
      raw: true
    });

    res.json(evolucion);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener evolución' });
  }
});

// GET - Resumen por tipo de equipo
router.get('/tipos', authenticateToken, requireObservador, async (req, res) => {
  try {
    const tipos = await Equipo.findAll({
      attributes: [
        'tipo_equipo',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'cantidad']
      ],
      where: { estado: { [Op.ne]: 'Dado de Baja' } },
      group: ['tipo_equipo'],
      raw: true
    });

    res.json(tipos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener tipos' });
  }
});

module.exports = router;
