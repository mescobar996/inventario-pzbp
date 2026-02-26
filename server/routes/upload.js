const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { parse } = require('csv-parse/sync');
const XLSX = require('xlsx');
const { Equipo, Destino, HistorialMovimiento } = require('../config/database');
const { authenticateToken, requireObservador } = require('../middleware/auth');

const router = express.Router();

// Función helper para parsear cualquier tipo de archivo
const parseFile = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === '.csv') {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      delimiter: [';', ',', '\t']
    });
  } else if (ext === '.xlsx' || ext === '.xls') {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(sheet, { defval: '' });
  }
  
  throw new Error('Tipo de archivo no soportado');
};

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

// POST - Parsear archivo (para preview y auto-mapeo)
router.post('/parse', authenticateToken, requireObservador, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha proporcionado ningún archivo' });
    }

    const filePath = req.file.path;
    
    let records;
    try {
      records = parseFile(filePath);
    } catch (parseError) {
      console.error('Error parsing file:', parseError);
      return res.status(400).json({ error: 'Error al parsear el archivo. Verifica que el formato sea correcto.' });
    }

    // Limpiar archivo
    fs.unlinkSync(filePath);

    if (!records || records.length === 0) {
      return res.status(400).json({ error: 'El archivo está vacío o no tiene datos' });
    }

    const columns = Object.keys(records[0]);
    
    // Obtener destinos para auto-mapeo
    const destinos = await Destino.findAll({ where: { activo: true } });
    const destinoMap = {};
    destinos.forEach(d => {
      destinoMap[d.nombre.toLowerCase()] = d;
      destinoMap[d.codigo.toLowerCase()] = d;
    });

    // Auto-mapear columnas
    const autoMapping = {};
    const entityFields = {
      n_orden: ['n_orden', 'n° orden', 'orden', 'no orden'],
      n_inventario: ['n_inventario', 'n° de inventario', 'inventario', 'numero inventario', 'nro inventario'],
      catalogo: ['catalogo', 'catálogo', 'cat', 'referencia'],
      ns_serial: ['ns_serial', 'ns', 'n/s', 'serial', 'numero serie', 'nro serie'],
      gebipa: ['gebipa', 'ge bipa'],
      tipo_equipo: ['tipo_equipo', 'tipo', 'tipo equipo', 'clase'],
      destino: ['destino', 'ubicacion', 'ubicación', 'lugar', 'sitio'],
      observaciones: ['observaciones', 'obs', 'observacion', 'notas', 'notas observations'],
      estado: ['estado', 'status', 'situacion', 'situación']
    };

    columns.forEach(col => {
      const normalizedCol = col.toLowerCase().replace(/[_\s\.\-]/g, '');
      
      for (const [field, variations] of Object.entries(entityFields)) {
        if (variations.some(v => normalizedCol.includes(v) || v.includes(normalizedCol))) {
          autoMapping[field] = col;
          break;
        }
      }
    });

    // Procesar datos y auto-completar destinos
    const processedData = records.map((row, idx) => {
      const processed = { _rowIndex: idx + 1 };
      
      for (const [field, col] of Object.entries(autoMapping)) {
        if (col && row[col] !== undefined) {
          processed[field] = row[col];
        }
      }
      
      // Auto-resolver destino
      if (processed.destino) {
        const destinoKey = processed.destino.toString().toLowerCase().trim();
        const matchedDestino = destinoMap[destinoKey];
        if (matchedDestino) {
          processed.destino_id = matchedDestino.id;
          processed.destino_nombre = matchedDestino.nombre;
          processed.destino_color = matchedDestino.color;
        } else {
          processed.destino_id = null;
          processed.destino_nombre = 'No encontrado';
        }
      }
      
      return processed;
    });

    res.json({
      columns,
      data: processedData.slice(0, 100),
      autoMapping,
      destinos: destinos.map(d => ({ id: d.id, nombre: d.nombre, codigo: d.codigo })),
      totalRows: records.length
    });

  } catch (error) {
    console.error('Error en parse:', error);
    res.status(500).json({ error: 'Error al parsear archivo: ' + error.message });
  }
});

// POST - Importar datos con mapeo (ya procesados)
router.post('/importar/:entidad', authenticateToken, requireObservador, async (req, res) => {
  try {
    const { entidad } = req.params;
    const { data, mapping } = req.body;

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }

    const resultados = {
      exitosos: [],
      errores: [],
      total: data.length
    };

    if (entidad === 'equipos') {
      for (const record of data) {
        try {
          // Usar los campos ya procesados (ya tienen destino_id resuelto)
          const n_inventario = record.n_inventario;
          const ns_serial = record.ns_serial;
          
          if (!n_inventario || !ns_serial) {
            resultados.errores.push({ row: record, error: 'Faltan campos requeridos: N° Inventario o N/S' });
            continue;
          }

          // Usar destino_id ya resuelto (del parseo)
          const destino_id = record.destino_id || null;

          // Verificar duplicados
          const existingSerial = await Equipo.findOne({ where: { ns_serial } });
          if (existingSerial) {
            resultados.errores.push({ row: record, error: `N/S duplicado: ${ns_serial}` });
            continue;
          }

          const existingInventario = await Equipo.findOne({ where: { n_inventario } });
          if (existingInventario) {
            resultados.errores.push({ row: record, error: `N° de inventario duplicado: ${n_inventario}` });
            continue;
          }

          // Crear equipo
          const equipo = await Equipo.create({
            n_orden: record.n_orden || '',
            n_inventario,
            catalogo: record.catalogo || '',
            ns_serial,
            gebipa: record.gebipa || '',
            tipo_equipo: record.tipo_equipo || 'Equipo',
            destino_id,
            observaciones: record.observaciones || '',
            estado: record.estado || 'Activo'
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
            observaciones: 'Carga masiva'
          });

          resultados.exitosos.push({ id: equipo.id, n_inventario: equipo.n_inventario });

        } catch (err) {
          resultados.errores.push({ row: record._rowIndex || '?', error: err.message });
        }
      }
    }

    res.json({
      message: `Importación completada: ${resultados.exitosos.length} exitosos, ${resultados.errores.length} errores`,
      importados: resultados.exitosos.length,
      ...resultados
    });

  } catch (error) {
    console.error('Error en importar:', error);
    res.status(500).json({ error: 'Error al importar datos: ' + error.message });
  }
});

module.exports = router;
