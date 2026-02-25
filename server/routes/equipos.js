const express = require('express');
const { Op } = require('sequelize');
const { Equipo, Destino, HistorialMovimiento, Usuario } = require('../config/database');
const { authenticateToken, requireAdmin, requireObservador } = require('../middleware/auth');

const router = express.Router();

// Función helper para crear registro en historial
const crearHistorial = async (equipo, tipoMovimiento, destinoOrigen, destinoNuevo, observaciones, req) => {
  await HistorialMovimiento.create({
    equipo_id: equipo.id,
    n_inventario: equipo.n_inventario,
    ns_serial: equipo.ns_serial,
    destino_origen_id: destinoOrigen?.id || null,
    destino_origen_nombre: destinoOrigen?.nombre || 'Sin asignar',
    destino_nuevo_id: destinoNuevo?.id || null,
    destino_nuevo_nombre: destinoNuevo?.nombre || 'Sin asignar',
    usuario_id: req.usuario.id,
    usuario_nombre: req.usuario.nombre_completo || req.usuario.username,
    tipo_movimiento: tipoMovimiento,
    observaciones: observaciones || `Movimiento tipo: ${tipoMovimiento}`
  });
};

// GET - Listar todos los equipos
router.get('/', authenticateToken, requireObservador, async (req, res) => {
  try {
    const { destino, tipo, estado, search, limit = 100, offset = 0 } = req.query;

    const where = {};
    
    if (destino) where.destino_id = destino;
    if (tipo) where.tipo_equipo = tipo;
    if (estado) where.estado = estado;
    
    if (search) {
      where[Op.or] = [
        { n_inventario: { [Op.like]: `%${search}%` } },
        { ns_serial: { [Op.like]: `%${search}%` } },
        { catalogo: { [Op.like]: `%${search}%` } },
        { gebipa: { [Op.like]: `%${search}%` } }
      ];
    }

    const equipos = await Equipo.findAll({
      where,
      include: [{ model: Destino, as: 'destino', attributes: ['id', 'nombre', 'codigo', 'color'] }],
      order: [['n_inventario', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const total = await Equipo.count({ where });

    res.json({ equipos, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (error) {
    console.error('Error al listar equipos:', error);
    res.status(500).json({ error: 'Error al listar equipos' });
  }
});

// GET - Obtener un equipo específico
router.get('/:id', authenticateToken, requireObservador, async (req, res) => {
  try {
    const equipo = await Equipo.findByPk(req.params.id, {
      include: [{ model: Destino, as: 'destino' }]
    });
    
    if (!equipo) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }
    
    // Obtener historial del equipo
    const historial = await HistorialMovimiento.findAll({
      where: { equipo_id: req.params.id },
      order: [['fecha_movimiento', 'DESC']],
      limit: 20
    });

    res.json({ equipo, historial });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener equipo' });
  }
});

// POST - Crear nuevo equipo
router.post('/', authenticateToken, requireObservador, async (req, res) => {
  try {
    const { n_orden, n_inventario, catalogo, ns_serial, gebipa, tipo_equipo, destino_id, observaciones } = req.body;

    // Validaciones
    if (!n_inventario || !ns_serial) {
      return res.status(400).json({ error: 'N° de inventario y N/S son requeridos' });
    }

    // Verificar duplicados de N/S
    const existingSerial = await Equipo.findOne({ 
      where: { ns_serial } 
    });
    if (existingSerial) {
      return res.status(400).json({ 
        error: 'Ya existe un equipo con este número de serie (N/S)',
        equipo_existente: {
          id: existingSerial.id,
          n_inventario: existingSerial.n_inventario,
          destino_id: existingSerial.destino_id
        }
      });
    }

    // Verificar duplicados de N° inventario
    const existingInventario = await Equipo.findOne({ 
      where: { n_inventario } 
    });
    if (existingInventario) {
      return res.status(400).json({ 
        error: 'Ya existe un equipo con este número de inventario',
        equipo_existente: {
          id: existingInventario.id,
          ns_serial: existingInventario.ns_serial
        }
      });
    }

    const destino = destino_id ? await Destino.findByPk(destino_id) : null;

    const equipo = await Equipo.create({
      n_orden,
      n_inventario,
      catalogo,
      ns_serial,
      gebipa,
      tipo_equipo: tipo_equipo || 'Equipo',
      destino_id,
      observaciones
    });

    // Crear registro en historial (Alta)
    await crearHistorial(equipo, 'Alta', null, destino, 'Equipo dado de alta en el sistema', req);

    res.status(201).json(equipo);
  } catch (error) {
    console.error('Error al crear equipo:', error);
    res.status(500).json({ error: 'Error al crear equipo' });
  }
});

// PUT - Actualizar equipo
router.put('/:id', authenticateToken, requireObservador, async (req, res) => {
  try {
    const equipo = await Equipo.findByPk(req.params.id);
    if (!equipo) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }

    const { n_orden, n_inventario, catalogo, ns_serial, gebipa, tipo_equipo, destino_id, observaciones, estado } = req.body;

    const destinoOrigen = await Destino.findByPk(equipo.destino_id);
    const destinoNuevo = destino_id ? await Destino.findByPk(destino_id) : null;

    // Verificar duplicados de N/S si cambió
    if (ns_serial && ns_serial !== equipo.ns_serial) {
      const existing = await Equipo.findOne({ where: { ns_serial } });
      if (existing) {
        return res.status(400).json({ error: 'Ya existe otro equipo con este número de serie' });
      }
    }

    // Verificar duplicados de N° inventario si cambió
    if (n_inventario && n_inventario !== equipo.n_inventario) {
      const existing = await Equipo.findOne({ where: { n_inventario } });
      if (existing) {
        return res.status(400).json({ error: 'Ya existe otro equipo con este número de inventario' });
      }
    }

    await equipo.update({
      n_orden: n_orden !== undefined ? n_orden : equipo.n_orden,
      n_inventario: n_inventario !== undefined ? n_inventario : equipo.n_inventario,
      catalogo: catalogo !== undefined ? catalogo : equipo.catalogo,
      ns_serial: ns_serial !== undefined ? ns_serial : equipo.ns_serial,
      gebipa: gebipa !== undefined ? gebipa : equipo.gebipa,
      tipo_equipo: tipo_equipo || equipo.tipo_equipo,
      destino_id: destino_id !== undefined ? destino_id : equipo.destino_id,
      observaciones: observaciones !== undefined ? observaciones : equipo.observaciones,
      estado: estado || equipo.estado
    });

    // Registrar movimiento si cambió el destino
    if (destino_id !== undefined && destino_id !== equipo.destino_id) {
      await crearHistorial(equipo, 'Traslado', destinoOrigen, destinoNuevo, 
        `Traslado de ${destinoOrigen?.nombre || 'Sin asignar'} a ${destinoNuevo?.nombre || 'Sin asignar'}`, req);
    }

    // Registrar cambio de estado si cambió
    if (estado && estado !== equipo.estado) {
      await crearHistorial(equipo, 'Cambio Estado', destinoOrigen, destinoNuevo,
        `Cambio de estado: ${equipo.estado} → ${estado}`, req);
    }

    const equipoActualizado = await Equipo.findByPk(equipo.id, {
      include: [{ model: Destino, as: 'destino' }]
    });

    res.json(equipoActualizado);
  } catch (error) {
    console.error('Error al actualizar equipo:', error);
    res.status(500).json({ error: 'Error al actualizar equipo' });
  }
});

// PATCH - Cambiar destino de un equipo (traslado rápido)
router.patch('/:id/trasladar', authenticateToken, requireObservador, async (req, res) => {
  try {
    const { destino_id, observaciones } = req.body;

    const equipo = await Equipo.findByPk(req.params.id);
    if (!equipo) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }

    const destinoOrigen = await Destino.findByPk(equipo.destino_id);
    const destinoNuevo = await Destino.findByPk(destino_id);

    await equipo.update({ destino_id });

    await crearHistorial(equipo, 'Traslado', destinoOrigen, destinoNuevo, observaciones, req);

    const equipoActualizado = await Equipo.findByPk(equipo.id, {
      include: [{ model: Destino, as: 'destino' }]
    });

    res.json(equipoActualizado);
  } catch (error) {
    console.error('Error al trasladar equipo:', error);
    res.status(500).json({ error: 'Error al trasladar equipo' });
  }
});

// DELETE - Eliminar equipo (solo admin)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const equipo = await Equipo.findByPk(req.params.id);
    if (!equipo) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }

    const destino = await Destino.findByPk(equipo.destino_id);

    // Crear registro de baja
    await crearHistorial(equipo, 'Baja', destino, null, 'Equipo dado de baja del sistema', req);

    await equipo.destroy();
    res.json({ message: 'Equipo eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar equipo:', error);
    res.status(500).json({ error: 'Error al eliminar equipo' });
  }
});

// POST - Carga masiva de equipos
router.post('/bulk', authenticateToken, requireObservador, async (req, res) => {
  try {
    const { equipos } = req.body;

    if (!Array.isArray(equipos) || equipos.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de equipos' });
    }

    const resultados = {
      exitosos: [],
      errores: []
    };

    for (const equipoData of equipos) {
      try {
        // Verificar duplicados
        const existingSerial = await Equipo.findOne({ 
          where: { ns_serial: equipoData.ns_serial } 
        });
        
        const existingInventario = await Equipo.findOne({ 
          where: { n_inventario: equipoData.n_inventario } 
        });

        if (existingSerial) {
          resultados.errores.push({
            data: equipoData,
            error: 'N/S duplicado'
          });
          continue;
        }

        if (existingInventario) {
          resultados.errores.push({
            data: equipoData,
            error: 'N° de inventario duplicado'
          });
          continue;
        }

        const destino = equipoData.destino_id ? await Destino.findByPk(equipoData.destino_id) : null;

        const equipo = await Equipo.create({
          n_orden: equipoData.n_orden,
          n_inventario: equipoData.n_inventario,
          catalogo: equipoData.catalogo,
          ns_serial: equipoData.ns_serial,
          gebipa: equipoData.gebipa,
          tipo_equipo: equipoData.tipo_equipo || 'Equipo',
          destino_id: equipoData.destino_id,
          observaciones: equipoData.observaciones
        });

        await crearHistorial(equipo, 'Alta', null, destino, 'Carga masiva', req);
        resultados.exitosos.push(equipo);

      } catch (err) {
        resultados.errores.push({
          data: equipoData,
          error: err.message
        });
      }
    }

    res.json({
      message: `Carga masiva completada: ${resultados.exitosos.length} exitosos, ${resultados.errores.length} errores`,
      ...resultados
    });
  } catch (error) {
    console.error('Error en carga masiva:', error);
    res.status(500).json({ error: 'Error en carga masiva' });
  }
});

module.exports = router;
