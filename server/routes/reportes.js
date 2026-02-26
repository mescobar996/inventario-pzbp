const express = require('express');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { Op } = require('sequelize');
const { Equipo, Destino } = require('../config/database');
const { authenticateToken, requireObservador } = require('../middleware/auth');

const router = express.Router();

// GET /api/reportes/excel - Exportar inventario a Excel
router.get('/excel', authenticateToken, requireObservador, async (req, res) => {
  try {
    const { destino_id, tipo, estado } = req.query;

    const where = {};
    if (destino_id) where.destino_id = destino_id;
    if (tipo) where.tipo_equipo = tipo;
    if (estado) where.estado = estado;

    const equipos = await Equipo.findAll({
      where,
      include: [{ model: Destino, as: 'destino', attributes: ['nombre', 'codigo'] }],
      order: [['destino_id', 'ASC'], ['n_inventario', 'ASC']]
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Inventario PZBP';
    workbook.created = new Date();

    // Hoja de resumen
    const resumenSheet = workbook.addWorksheet('Resumen');
    resumenSheet.columns = [
      { header: 'Tipo', key: 'tipo', width: 20 },
      { header: 'Cantidad', key: 'cantidad', width: 15 }
    ];

    const totalEquipos = equipos.filter(e => e.tipo_equipo === 'Equipo').length;
    const totalBaterias = equipos.filter(e => e.tipo_equipo === 'Batería').length;
    const totalBases = equipos.filter(e => e.tipo_equipo === 'Base Cargadora').length;

    resumenSheet.addRow({ tipo: 'Equipos (Radios)', cantidad: totalEquipos });
    resumenSheet.addRow({ tipo: 'Baterías', cantidad: totalBaterias });
    resumenSheet.addRow({ tipo: 'Bases Cargadoras', cantidad: totalBases });
    resumenSheet.addRow({ tipo: 'TOTAL', cantidad: equipos.length });

    // Estilo del encabezado de resumen
    resumenSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    resumenSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
    resumenSheet.getRow(5).font = { bold: true };

    // Hoja de inventario completo
    const inventarioSheet = workbook.addWorksheet('Inventario Completo');
    inventarioSheet.columns = [
      { header: 'N° Orden', key: 'n_orden', width: 15 },
      { header: 'N° Inventario', key: 'n_inventario', width: 18 },
      { header: 'Catálogo', key: 'catalogo', width: 20 },
      { header: 'N/S (Serial)', key: 'ns_serial', width: 20 },
      { header: 'GEBIPA', key: 'gebipa', width: 15 },
      { header: 'Tipo', key: 'tipo_equipo', width: 18 },
      { header: 'Destino', key: 'destino', width: 12 },
      { header: 'Estado', key: 'estado', width: 15 },
      { header: 'Observaciones', key: 'observaciones', width: 30 },
      { header: 'Fecha Alta', key: 'fecha_alta', width: 15 }
    ];

    // Estilo del encabezado
    inventarioSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    inventarioSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
    inventarioSheet.getRow(1).alignment = { horizontal: 'center' };

    equipos.forEach((equipo, index) => {
      const row = inventarioSheet.addRow({
        n_orden: equipo.n_orden || '',
        n_inventario: equipo.n_inventario,
        catalogo: equipo.catalogo || '',
        ns_serial: equipo.ns_serial,
        gebipa: equipo.gebipa || '',
        tipo_equipo: equipo.tipo_equipo,
        destino: equipo.destino?.nombre || 'Sin asignar',
        estado: equipo.estado,
        observaciones: equipo.observaciones || '',
        fecha_alta: equipo.fecha_alta ? new Date(equipo.fecha_alta).toLocaleDateString('es-AR') : ''
      });

      // Colorear filas alternadas
      if (index % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4FF' } };
      }

      // Colorear estado
      const estadoCell = row.getCell('estado');
      if (equipo.estado === 'Activo') {
        estadoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
        estadoCell.font = { color: { argb: 'FF065F46' } };
      } else if (equipo.estado === 'Mantenimiento') {
        estadoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
        estadoCell.font = { color: { argb: 'FF92400E' } };
      } else if (equipo.estado === 'Dado de Baja') {
        estadoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        estadoCell.font = { color: { argb: 'FF991B1B' } };
      }
    });

    // Agregar bordes a todas las celdas
    inventarioSheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
        };
      });
    });

    // Hojas por destino
    const destinos = await Destino.findAll({ where: { activo: true }, order: [['nombre', 'ASC']] });
    
    for (const destino of destinos) {
      const equiposDestino = equipos.filter(e => e.destino_id === destino.id);
      if (equiposDestino.length === 0) continue;

      const sheet = workbook.addWorksheet(destino.nombre);
      sheet.columns = [
        { header: 'N° Orden', key: 'n_orden', width: 15 },
        { header: 'N° Inventario', key: 'n_inventario', width: 18 },
        { header: 'Catálogo', key: 'catalogo', width: 20 },
        { header: 'N/S (Serial)', key: 'ns_serial', width: 20 },
        { header: 'GEBIPA', key: 'gebipa', width: 15 },
        { header: 'Tipo', key: 'tipo_equipo', width: 18 },
        { header: 'Estado', key: 'estado', width: 15 },
        { header: 'Observaciones', key: 'observaciones', width: 30 }
      ];

      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };

      equiposDestino.forEach((equipo, index) => {
        const row = sheet.addRow({
          n_orden: equipo.n_orden || '',
          n_inventario: equipo.n_inventario,
          catalogo: equipo.catalogo || '',
          ns_serial: equipo.ns_serial,
          gebipa: equipo.gebipa || '',
          tipo_equipo: equipo.tipo_equipo,
          estado: equipo.estado,
          observaciones: equipo.observaciones || ''
        });

        if (index % 2 === 0) {
          row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4FF' } };
        }
      });

      // Resumen al final de la hoja
      sheet.addRow([]);
      const resumenRow = sheet.addRow(['', 'TOTAL:', equiposDestino.length, '', '', '', '', '']);
      resumenRow.font = { bold: true };
    }

    // Enviar el archivo
    const fecha = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=inventario-pzbp-${fecha}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error al generar Excel:', error);
    res.status(500).json({ error: 'Error al generar el informe Excel' });
  }
});

// GET /api/reportes/pdf - Exportar inventario a PDF
router.get('/pdf', authenticateToken, requireObservador, async (req, res) => {
  try {
    const { destino_id, tipo, estado } = req.query;

    const where = {};
    if (destino_id) where.destino_id = destino_id;
    if (tipo) where.tipo_equipo = tipo;
    if (estado) where.estado = estado;

    const equipos = await Equipo.findAll({
      where,
      include: [{ model: Destino, as: 'destino', attributes: ['nombre', 'codigo'] }],
      order: [['destino_id', 'ASC'], ['n_inventario', 'ASC']]
    });

    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });

    const fecha = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=inventario-pzbp-${fecha}.pdf`);
    doc.pipe(res);

    // Encabezado
    doc.rect(0, 0, doc.page.width, 70).fill('#1E3A5F');
    doc.fillColor('white').fontSize(20).font('Helvetica-Bold')
      .text('INVENTARIO PZBP', 40, 20);
    doc.fontSize(11).font('Helvetica')
      .text('Sistema de Gestión de Equipos de Radiocomunicación', 40, 45);
    doc.text(`Generado: ${new Date().toLocaleString('es-AR')}`, doc.page.width - 250, 45);

    doc.moveDown(2);

    // Resumen
    doc.fillColor('#1E3A5F').fontSize(14).font('Helvetica-Bold').text('Resumen del Inventario', 40, 90);
    doc.moveDown(0.5);

    const totalEquipos = equipos.filter(e => e.tipo_equipo === 'Equipo').length;
    const totalBaterias = equipos.filter(e => e.tipo_equipo === 'Batería').length;
    const totalBases = equipos.filter(e => e.tipo_equipo === 'Base Cargadora').length;

    const summaryY = 115;
    const boxWidth = 150;
    const boxHeight = 50;
    const gap = 20;

    // Cajas de resumen
    const drawSummaryBox = (x, y, label, value, color) => {
      doc.rect(x, y, boxWidth, boxHeight).fill(color);
      doc.fillColor('white').fontSize(10).font('Helvetica').text(label, x + 10, y + 8);
      doc.fontSize(22).font('Helvetica-Bold').text(value.toString(), x + 10, y + 22);
    };

    drawSummaryBox(40, summaryY, 'Total Equipos', equipos.length, '#1E3A5F');
    drawSummaryBox(40 + boxWidth + gap, summaryY, 'Radios', totalEquipos, '#3B82F6');
    drawSummaryBox(40 + (boxWidth + gap) * 2, summaryY, 'Baterías', totalBaterias, '#10B981');
    drawSummaryBox(40 + (boxWidth + gap) * 3, summaryY, 'Bases Cargadoras', totalBases, '#F59E0B');

    // Tabla de equipos
    const tableTop = summaryY + boxHeight + 30;
    const colWidths = [80, 100, 110, 110, 80, 90, 80, 80];
    const headers = ['N° Orden', 'N° Inventario', 'Catálogo', 'N/S (Serial)', 'GEBIPA', 'Tipo', 'Destino', 'Estado'];
    const colX = [40];
    for (let i = 1; i < colWidths.length; i++) {
      colX.push(colX[i - 1] + colWidths[i - 1]);
    }

    // Encabezado de tabla
    doc.rect(40, tableTop, colWidths.reduce((a, b) => a + b, 0), 22).fill('#1E3A5F');
    headers.forEach((h, i) => {
      doc.fillColor('white').fontSize(8).font('Helvetica-Bold')
        .text(h, colX[i] + 3, tableTop + 7, { width: colWidths[i] - 6 });
    });

    // Filas de datos
    let y = tableTop + 22;
    const rowHeight = 18;

    equipos.forEach((equipo, index) => {
      // Nueva página si es necesario
      if (y + rowHeight > doc.page.height - 40) {
        doc.addPage({ size: 'A4', layout: 'landscape' });
        y = 40;

        // Repetir encabezado
        doc.rect(40, y, colWidths.reduce((a, b) => a + b, 0), 22).fill('#1E3A5F');
        headers.forEach((h, i) => {
          doc.fillColor('white').fontSize(8).font('Helvetica-Bold')
            .text(h, colX[i] + 3, y + 7, { width: colWidths[i] - 6 });
        });
        y += 22;
      }

      // Fila alternada
      if (index % 2 === 0) {
        doc.rect(40, y, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill('#F0F4FF');
      }

      const rowData = [
        equipo.n_orden || '',
        equipo.n_inventario,
        equipo.catalogo || '',
        equipo.ns_serial,
        equipo.gebipa || '',
        equipo.tipo_equipo,
        equipo.destino?.nombre || 'Sin asignar',
        equipo.estado
      ];

      rowData.forEach((val, i) => {
        doc.fillColor('#1F2937').fontSize(7.5).font('Helvetica')
          .text(val.toString(), colX[i] + 3, y + 5, { width: colWidths[i] - 6, ellipsis: true });
      });

      // Línea separadora
      doc.moveTo(40, y + rowHeight).lineTo(40 + colWidths.reduce((a, b) => a + b, 0), y + rowHeight)
        .strokeColor('#E5E7EB').lineWidth(0.5).stroke();

      y += rowHeight;
    });

    // Pie de página
    doc.fontSize(8).fillColor('#6B7280').font('Helvetica')
      .text(`Total de registros: ${equipos.length}`, 40, y + 10);

    doc.end();

  } catch (error) {
    console.error('Error al generar PDF:', error);
    res.status(500).json({ error: 'Error al generar el informe PDF' });
  }
});

// GET /api/reportes/csv - Exportar a CSV
router.get('/csv', authenticateToken, requireObservador, async (req, res) => {
  try {
    const { destino_id, tipo, estado } = req.query;

    const where = {};
    if (destino_id) where.destino_id = destino_id;
    if (tipo) where.tipo_equipo = tipo;
    if (estado) where.estado = estado;

    const equipos = await Equipo.findAll({
      where,
      include: [{ model: Destino, as: 'destino', attributes: ['nombre', 'codigo'] }],
      order: [['destino_id', 'ASC'], ['n_inventario', 'ASC']]
    });

    const headers = ['N° ORDEN', 'N° DE INVENTARIO', 'CATÁLOGO', 'N/S', 'GEBIPA', 'TIPO', 'DESTINO', 'ESTADO', 'OBSERVACIONES', 'FECHA ALTA'];
    
    const rows = equipos.map(e => [
      e.n_orden || '',
      e.n_inventario,
      e.catalogo || '',
      e.ns_serial,
      e.gebipa || '',
      e.tipo_equipo,
      e.destino?.nombre || 'Sin asignar',
      e.estado,
      (e.observaciones || '').replace(/,/g, ';'),
      e.fecha_alta || ''
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const fecha = new Date().toISOString().split('T')[0];

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=inventario-pzbp-${fecha}.csv`);
    res.send('\uFEFF' + csv); // BOM para Excel en español

  } catch (error) {
    res.status(500).json({ error: 'Error al generar CSV' });
  }
});

module.exports = router;
