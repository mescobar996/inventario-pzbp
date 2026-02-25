const express = require('express');
const { Op } = require('sequelize');
const { HistorialMovimiento, Equipo, Destino, Usuario } = require('../config/database');
const { authenticateToken, requireObservador } = require('../middleware/auth');

const router = express.Router();

// GET - Listar historial de movimientos
router.get('/', authenticateToken, requireObservador, async (req, res) => {
  try {
    const { equipo_id, destino_id, tipo, fecha_inicio, fecha_fin, limit = 50, offset = 0 } = req.query;

    const where = {};

    if (equipo_id) where.equipo_id = equipo_id;
    if (destino_id) {
      where[Op.or] = [
        { destino_origen_id: destino_id },
        { destino_nuevo_id: destino_id }
      ];
    }
    if (tipo) where.tipo_movimiento = tipo;
    
    if (fecha_inicio || fecha_fin) {
      where.fecha_movimiento = {};
      if (fecha_inicio) where.fecha_movimiento[Op.gte] = new Date(fecha_inicio);
      if (fecha_fin) where.fecha_movimiento[Op.lte] = new Date(fecha_fin);
    }

    const historial = await HistorialMovimiento.findAll({
      where,
      include: [
        { model: Equipo, as: 'equipo', attributes: ['id', 'n_inventario', 'ns_serial'] }
      ],
      order: [['fecha_movimiento', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const total = await HistorialMovimiento.count({ where });

    res.json({ historial, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (error) {
    console.error('Error al listar historial:', error);
    res.status(500).json({ error: 'Error al listar historial' });
  }
});

// GET - Obtener historial de un equipo específico
router.get('/equipo/:equipoId', authenticateToken, requireObservador, async (req, res) => {
  try {
    const historial = await HistorialMovimiento.findAll({
      where: { equipo_id: req.params.equipoId },
      order: [['fecha_movimiento', 'DESC']]
    });
    res.json(historial);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener historial del equipo' });
  }
});

// GET - Estadísticas del historial
router.get('/estadisticas', authenticateToken, requireObservador, async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;

    const whereFecha = {};
    if (fecha_inicio) whereFecha[Op.gte] = new Date(fecha_inicio);
    if (fecha_fin) whereFecha[Op.lte] = new Date(fecha_fin);

    const estadisticas = await HistorialMovimiento.findAll({
      attributes: [
        'tipo_movimiento',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'cantidad']
      ],
      where: Object.keys(whereFecha).length > 0 ? { fecha_movimiento: whereFecha } : {},
      group: ['tipo_movimiento'],
      raw: true
    });

    const porUsuario = await HistorialMovimiento.findAll({
      attributes: [
        'usuario_nombre',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'cantidad']
      ],
      where: Object.keys(whereFecha).length > 0 ? { fecha_movimiento: whereFecha } : {},
      group: ['usuario_nombre'],
      order: [[require('sequelize').literal('cantidad'), 'DESC']],
      limit: 10,
      raw: true
    });

    res.json({ estadisticas, porUsuario });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

module.exports = router;
