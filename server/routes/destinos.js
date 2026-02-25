const express = require('express');
const { Destino, Equipo } = require('../config/database');
const { authenticateToken, requireAdmin, requireObservador } = require('../middleware/auth');

const router = express.Router();

// GET - Listar todos los destinos
router.get('/', authenticateToken, requireObservador, async (req, res) => {
  try {
    const destinos = await Destino.findAll({
      where: { activo: true },
      order: [['nombre', 'ASC']]
    });
    res.json(destinos);
  } catch (error) {
    console.error('Error al listar destinos:', error);
    res.status(500).json({ error: 'Error al listar destinos' });
  }
});

// GET - Obtener un destino específico
router.get('/:id', authenticateToken, requireObservador, async (req, res) => {
  try {
    const destino = await Destino.findByPk(req.params.id);
    if (!destino) {
      return res.status(404).json({ error: 'Destino no encontrado' });
    }
    res.json(destino);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener destino' });
  }
});

// POST - Crear nuevo destino (solo admin)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { nombre, codigo, descripcion, color } = req.body;

    if (!nombre || !codigo) {
      return res.status(400).json({ error: 'Nombre y código son requeridos' });
    }

    // Verificar duplicados
    const existing = await Destino.findOne({
      where: { 
        [require('sequelize').Op.or]: [{ nombre }, { codigo }]
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Ya existe un destino con ese nombre o código' });
    }

    const destino = await Destino.create({
      nombre,
      codigo: codigo.toUpperCase(),
      descripcion,
      color: color || '#3B82F6'
    });

    res.status(201).json(destino);
  } catch (error) {
    console.error('Error al crear destino:', error);
    res.status(500).json({ error: 'Error al crear destino' });
  }
});

// PUT - Actualizar destino (solo admin)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const destino = await Destino.findByPk(req.params.id);
    if (!destino) {
      return res.status(404).json({ error: 'Destino no encontrado' });
    }

    const { nombre, codigo, descripcion, color } = req.body;

    // Verificar duplicados con otros registros
    if (nombre || codigo) {
      const existing = await Destino.findOne({
        where: {
          [require('sequelize').Op.and]: [
            { id: { [require('sequelize').Op.ne]: req.params.id } },
            {
              [require('sequelize').Op.or]: [
                nombre ? { nombre } : null,
                codigo ? { codigo: codigo.toUpperCase() } : null
              ].filter(Boolean)
            }
          ]
        }
      });

      if (existing) {
        return res.status(400).json({ error: 'Ya existe otro destino con ese nombre o código' });
      }
    }

    await destino.update({
      nombre: nombre || destino.nombre,
      codigo: codigo ? codigo.toUpperCase() : destino.codigo,
      descripcion: descripcion !== undefined ? descripcion : destino.descripcion,
      color: color || destino.color
    });

    res.json(destino);
  } catch (error) {
    console.error('Error al actualizar destino:', error);
    res.status(500).json({ error: 'Error al actualizar destino' });
  }
});

// DELETE - Eliminar destino (solo admin)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const destino = await Destino.findByPk(req.params.id);
    if (!destino) {
      return res.status(404).json({ error: 'Destino no encontrado' });
    }

    // Verificar si hay equipos asociados
    const equiposCount = await Equipo.count({
      where: { destino_id: req.params.id }
    });

    if (equiposCount > 0) {
      // En lugar de eliminar, desactivamos el destino
      await destino.update({ activo: false });
      return res.json({ 
        message: `Destino desactivado. ${equiposCount} equipos fueron desvinculados.`,
        equipos_desvinculados: equiposCount
      });
    }

    await destino.destroy();
    res.json({ message: 'Destino eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar destino:', error);
    res.status(500).json({ error: 'Error al eliminar destino' });
  }
});

// GET - Obtener equipos de un destino
router.get('/:id/equipos', authenticateToken, requireObservador, async (req, res) => {
  try {
    const equipos = await Equipo.findAll({
      where: { destino_id: req.params.id },
      order: [['n_inventario', 'ASC']]
    });
    res.json(equipos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener equipos del destino' });
  }
});

module.exports = router;
