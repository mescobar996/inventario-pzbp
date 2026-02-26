import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FileText, Download, FileSpreadsheet, Filter } from 'lucide-react';

const Reportes = () => {
  const [destinos, setDestinos] = useState([]);
  const [filtros, setFiltros] = useState({
    destino_id: '',
    tipo: '',
    estado: ''
  });
  const [loading, setLoading] = useState({ excel: false, pdf: false, csv: false });

  useEffect(() => {
    api.get('/destinos').then(r => setDestinos(r.data)).catch(console.error);
  }, []);

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (filtros.destino_id) params.append('destino_id', filtros.destino_id);
    if (filtros.tipo) params.append('tipo', filtros.tipo);
    if (filtros.estado) params.append('estado', filtros.estado);
    return params.toString();
  };

  const descargar = async (formato) => {
    setLoading(prev => ({ ...prev, [formato]: true }));
    try {
      const token = localStorage.getItem('token');
      const query = buildQuery();
      const url = `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/reportes/${formato}${query ? '?' + query : ''}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Error al descargar');

      const blob = await response.blob();
      const fecha = new Date().toISOString().split('T')[0];
      const extensiones = { excel: 'xlsx', pdf: 'pdf', csv: 'csv' };
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `inventario-pzbp-${fecha}.${extensiones[formato]}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(link.href);
    } catch (err) {
      alert('Error al generar el informe: ' + err.message);
    } finally {
      setLoading(prev => ({ ...prev, [formato]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Reportes e Informes</h1>
        <p className="text-gray-500">Exportá el inventario en distintos formatos</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-4">
          <Filter className="w-5 h-5 text-gray-500 mr-2" />
          <h2 className="text-lg font-semibold text-gray-700">Filtros (opcional)</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Destino</label>
            <select
              value={filtros.destino_id}
              onChange={e => setFiltros({ ...filtros, destino_id: e.target.value })}
              className="select"
            >
              <option value="">Todos los destinos</option>
              {destinos.map(d => (
                <option key={d.id} value={d.id}>{d.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de equipo</label>
            <select
              value={filtros.tipo}
              onChange={e => setFiltros({ ...filtros, tipo: e.target.value })}
              className="select"
            >
              <option value="">Todos los tipos</option>
              <option value="Equipo">Equipo (Radio)</option>
              <option value="Batería">Batería</option>
              <option value="Base Cargadora">Base Cargadora</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={filtros.estado}
              onChange={e => setFiltros({ ...filtros, estado: e.target.value })}
              className="select"
            >
              <option value="">Todos los estados</option>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
              <option value="Mantenimiento">Mantenimiento</option>
              <option value="Dado de Baja">Dado de Baja</option>
            </select>
          </div>
        </div>
      </div>

      {/* Opciones de exportación */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

        {/* Excel */}
        <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-green-500">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-green-100 rounded-full mr-4">
              <FileSpreadsheet className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Excel (.xlsx)</h3>
              <p className="text-sm text-gray-500">Recomendado</p>
            </div>
          </div>
          <ul className="text-sm text-gray-600 space-y-1 mb-6">
            <li>✅ Hoja de resumen con totales</li>
            <li>✅ Inventario completo con colores</li>
            <li>✅ Una hoja por cada destino</li>
            <li>✅ Compatible con Excel y LibreOffice</li>
          </ul>
          <button
            onClick={() => descargar('excel')}
            disabled={loading.excel}
            className="w-full btn btn-success flex items-center justify-center disabled:opacity-50"
          >
            {loading.excel ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Generando...
              </span>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Descargar Excel
              </>
            )}
          </button>
        </div>

        {/* PDF */}
        <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-red-500">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-red-100 rounded-full mr-4">
              <FileText className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">PDF (.pdf)</h3>
              <p className="text-sm text-gray-500">Para imprimir</p>
            </div>
          </div>
          <ul className="text-sm text-gray-600 space-y-1 mb-6">
            <li>✅ Formato A4 horizontal</li>
            <li>✅ Cajas de resumen visual</li>
            <li>✅ Tabla con todos los equipos</li>
            <li>✅ Listo para imprimir o compartir</li>
          </ul>
          <button
            onClick={() => descargar('pdf')}
            disabled={loading.pdf}
            className="w-full btn btn-danger flex items-center justify-center disabled:opacity-50"
          >
            {loading.pdf ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Generando...
              </span>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Descargar PDF
              </>
            )}
          </button>
        </div>

        {/* CSV */}
        <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-blue-500">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full mr-4">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">CSV (.csv)</h3>
              <p className="text-sm text-gray-500">Para importar</p>
            </div>
          </div>
          <ul className="text-sm text-gray-600 space-y-1 mb-6">
            <li>✅ Formato simple y universal</li>
            <li>✅ Compatible con cualquier sistema</li>
            <li>✅ Ideal para migrar datos</li>
            <li>✅ Con BOM para Excel en español</li>
          </ul>
          <button
            onClick={() => descargar('csv')}
            disabled={loading.csv}
            className="w-full btn btn-primary flex items-center justify-center disabled:opacity-50"
          >
            {loading.csv ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Generando...
              </span>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Descargar CSV
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          <strong>💡 Tip:</strong> Podés filtrar por destino, tipo o estado antes de descargar para obtener un informe parcial. 
          Sin filtros, se exporta el inventario completo.
        </p>
      </div>
    </div>
  );
};

export default Reportes;
