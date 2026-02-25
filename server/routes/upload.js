const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { parse } = require('csv-parse/sync');
const { Equipo, Destino, HistorialMovimiento } = require('../config/database');
const { authenticateToken, requireObservador } = require('../middleware/auth');

const router = express.Router();

// Configuración de multer para almacenar archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo CSV, XLSX o XLS'));
    }
  }
});

// POST - Subir y procesar archivo CSV
router.post('/csv', authenticateToken, requireObservador, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha proporcionado ningún archivo' });
    }

    const filePath = req.file.path;
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    let records;
    try {
      records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        delimiter: [';', ',', '\t']
      });
    } catch (parseError) {
      return res.status(400).json({ error: 'Error al parsear el archivo CSV' });
    }

    if (records.length === 0) {
      return res.status(400).json({ error: 'El archivo está vacío' });
    }

    const resultados = {
      exitosos: [],
      errores: [],
      total: records.length
    };

    // Obtener mapeo de códigos de destino a IDs
    const destinos = await Destino.findAll({ where: { activo: true } });
    const destinoMap = {};
    destinos.forEach(d => {
      destinoMap[d.codigo.toUpperCase()] = d.id;
      destinoMap[d.nombre.toUpperCase()] = d.id;
    });

    // Mapeo de tipos de equipo
    const tipoMap = {
      'EQUIPO': 'Equipo',
      'RADIO': 'Equipo',
      'RADIOS': 'Equipo',
      'BATERÍA': 'Batería',
      'BATERIA': 'Batería',
      'BATERÍAS': 'Batería',
      'BASE': 'Base Cargadora',
      'BASE CARGADORA': 'Base Cargadora',
      'CARGADOR': 'Base Cargadora'
    };

    for (const record of records) {
      try {
        // Normalizar campos
        const n_orden = record['N° ORDEN'] || record['N_ORDEN'] || record['ORDEN'] || record['orden'] || '';
        const n_inventario = record['N° DE INVENTARIO'] || record['N_INVENTARIO'] || record['INVENTARIO'] || record['inventario'] || '';
        const catalogo = record['CATÁLOGO'] || record['CATALOGO'] || record['catalogo'] || '';
        const ns_serial = record['N/S'] || record['NS'] || record['NS_SERIAL'] || record['ns_serial'] || record['SERIAL'] || record['serial'] || '';
        const gebipa = record['GEBIPA'] || record['gebipa'] || '';
        const observaciones = record['OBSERVACIONES'] || record['observaciones'] || record['OBS'] || '';
        
        // Determinar tipo de equipo
        let tipo_equipo = 'Equipo';
        const tipoRaw = record['TIPO'] || record['tipo'] || record['TIPO_EQUIPO'] || record['tipo_equipo'] || '';
        if (tipoRaw) {
          tipo_equipo = tipoMap[tipoRaw.toUpperCase()] || 'Equipo';
        }

        // Determinar destino
        let destino_id = null;
        const destinoRaw = record['DESTINO'] || record['destino'] || record['UBICACION'] || record['ubicacion'] || '';
        if (destinoRaw) {
          destino_id = destinoMap[destinoRaw.toUpperCase()] || null;
        }

        // Validar campos requeridos
        if (!n_inventario || !ns_serial) {
          resultados.errores.push({
            row: record,
            error: 'Faltan campos requeridos: N° de inventario o N/S'
          });
          continue;
        }

        // Verificar duplicados
        const existingSerial = await Equipo.findOne({ where: { ns_serial } });
        if (existingSerial) {
          resultados.errores.push({
            row: record,
            error: `N/S duplicado: ${ns_serial}`
          });
          continue;
        }

        const existingInventario = await Equipo.findOne({ where: { n_inventario } });
        if (existingInventario) {
          resultados.errores.push({
            row: record,
            error: `N° de inventario duplicado: ${n_inventario}`
          });
          continue;
        }

        // Crear equipo
        const equipo = await Equipo.create({
          n_orden,
          n_inventario,
          catalogo,
          ns_serial,
          gebipa,
          tipo_equipo,
          destino_id,
          observaciones,
          estado: 'Activo'
        });

        // Crear historial
        const destino = destino_id ? await Destino.findByPk(destino_id) : null;
        await HistorialMovimiento.create({
          equipo_id: equipo.id,
          n_inventario: equipo.n_inventario,
          ns_serial: equipo.ns_serial,
          destino_origen_id: null,
          destino_origen_nombre: 'Sin asignar',
          destino_nuevo_id: destino_id,
          destino_nuevo_nombre: destino?.nombre || 'Sin asignar',
          usuario_id: req.usuario.id,
          usuario_nombre: req.usuario.nombre_completo || req.usuario.username,
          tipo_movimiento: 'Alta',
          observaciones: 'Carga masiva desde CSV'
        });

        resultados.exitosos.push({
          id: equipo.id,
          n_inventario: equipo.n_inventario,
          ns_serial: equipo.ns_serial
        });

      } catch (err) {
        resultados.errores.push({
          row: record,
          error: err.message
        });
      }
    }

    // Limpiar archivo subido
    fs.unlinkSync(filePath);

    res.json({
      message: `Carga completada: ${resultados.exitosos.length} exitosos, ${resultados.errores.length} errores`,
      ...resultados
    });

  } catch (error) {
    console.error('Error en upload CSV:', error);
    res.status(500).json({ error: 'Error al procesar archivo' });
  }
});

// GET - Descargar plantilla CSV
router.get('/plantilla', authenticateToken, requireObservador, (req, res) => {
  const plantilla = `N° ORDEN,N° DE INVENTARIO,CATÁLOGO,N/S,GEBIPA,TIPO,DESTINO,OBSERVACIONES
ORD-001,INV-2024-001,MOTOTRBO XPR7550,SN12345678,PZBP-001,Equipo,PZBP,Equipo en buen estado
ORD-002,INV-2024-002,MOTOTRBO XPR7550,SN12345679,PZBP-002,Equipo,PZBP,
ORD-003,INV-2024-003,PMNN4089,SN98765432,PZBP-003,Batería,PZBP,Batería nueva
ORD-004,INV-2024-004,WPLN4236,SN11111111,PZBP-004,Base Cargadora,PZBP,Base de carga rápida`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=plantilla_inventario.csv');
  res.send(plantilla);
});

module.exports = router;
