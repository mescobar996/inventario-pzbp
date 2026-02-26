import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Upload, FileSpreadsheet, ArrowRight, Check, AlertCircle, X, ChevronDown, Plus, User, FileText } from 'lucide-react';

// Definición de entidades y sus campos
const ENTITY_FIELDS = {
  equipos: {
    label: 'Equipos',
    icon: '📻',
    fields: [
      { key: 'n_orden', label: 'N° Orden', required: false, type: 'text' },
      { key: 'n_inventario', label: 'N° Inventario', required: true, type: 'text' },
      { key: 'catalogo', label: 'Catálogo', required: false, type: 'text' },
      { key: 'ns_serial', label: 'N/S Serial', required: true, type: 'text' },
      { key: 'gebipa', label: 'GEBIPA', required: false, type: 'text' },
      { key: 'tipo_equipo', label: 'Tipo', required: false, type: 'select', options: [
        'Equipo', 
        'HT APX 2000', 
        'APX 2500', 
        'APX 900', 
        'Batería', 
        'CARGADOR HT APX 2000',
        'CARGADOR MULTIPLE 6 BATERIAS'
      ]},
      { key: 'frecuencia', label: 'Frecuencia', required: false, type: 'select', options: ['VHF-062A', 'UHF-005A'], showOn: ['HT APX 2000', 'APX 2500', 'APX 900'] },
      { key: 'charger_id', label: 'ID Cargador', required: false, type: 'select', options: ['CAR-011', 'CAR-015'], showOn: ['CARGADOR HT APX 2000', 'CARGADOR MULTIPLE 6 BATERIAS'] },
      { key: 'cantidad', label: 'Cantidad', required: false, type: 'number', showOn: ['CARGADOR HT APX 2000', 'CARGADOR MULTIPLE 6 BATERIAS'] },
      { key: 'destino', label: 'Destino', required: false, type: 'text' },
      { key: 'observaciones', label: 'Observaciones', required: false, type: 'textarea' },
      { key: 'estado', label: 'Estado', required: false, type: 'select', options: ['Activo', 'Inactivo', 'Mantenimiento', 'Dado de Baja'] }
    ]
  },
  destinos: {
    label: 'Destinos',
    icon: '📍',
    fields: [
      { key: 'nombre', label: 'Nombre', required: true, type: 'text' },
      { key: 'codigo', label: 'Código', required: true, type: 'text' },
      { key: 'descripcion', label: 'Descripción', required: false, type: 'textarea' },
      { key: 'color', label: 'Color', required: false, type: 'color' }
    ]
  }
};

// Tipos de equipos que usan frecuencia
const TIPOS_CON_FRECUENCIA = ['HT APX 2000', 'APX 2500', 'APX 900'];

// Tipos de cargadores
const TIPOS_CARGADOR = ['CARGADOR HT APX 2000', 'CARGADOR MULTIPLE 6 BATERIAS'];

const Carga = () => {
  const { usuario } = useAuth();
  const [mode, setMode] = useState('individual'); // 'individual' or 'masiva'
  const [selectedEntity, setSelectedEntity] = useState('equipos');
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [fileColumns, setFileColumns] = useState([]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [destinos, setDestinos] = useState([]);
  
  // Estado para formulario individual
  const [formData, setFormData] = useState({
    n_orden: '',
    n_inventario: '',
    catalogo: '',
    ns_serial: '',
    gebipa: '',
    tipo_equipo: 'Equipo',
    frecuencia: '',
    charger_id: '',
    cantidad: '',
    destino_id: '',
    observaciones: '',
    estado: 'Activo'
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDestinos();
  }, []);

  const fetchDestinos = async () => {
    try {
      const res = await api.get('/destinos');
      setDestinos(res.data || []);
    } catch (err) {
      console.error('Error fetching destinos:', err);
    }
  };

  // Manejar cambio en formulario individual
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Validar formulario individual
  const validateForm = () => {
    const errors = {};
    if (!formData.n_inventario.trim()) {
      errors.n_inventario = 'N° Inventario es requerido';
    }
    if (!formData.ns_serial.trim()) {
      errors.ns_serial = 'N/S Serial es requerido';
    }
    return errors;
  };

  // Enviar formulario individual
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      await api.post('/equipos', formData);
      setSuccess(`¡Éxito! Equipo ${formData.n_inventario} guardado correctamente.`);
      setFormData({
        n_orden: '',
        n_inventario: '',
        catalogo: '',
        ns_serial: '',
        gebipa: '',
        tipo_equipo: 'Equipo',
        frecuencia: '',
        charger_id: '',
        cantidad: '',
        destino_id: '',
        observaciones: '',
        estado: 'Activo'
      });
      setFormErrors({});
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Error al guardar equipo';
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Manejar selección de archivo
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };

  // Parsear archivo CSV/Excel
  const parseFile = async (file) => {
    setLoading(true);
    setError(null);
    
    try {
      const formDataFile = new FormData();
      formDataFile.append('file', file);
      
      const res = await api.post('/upload/parse', formDataFile, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (res.data.columns && res.data.data) {
        setFileColumns(res.data.columns);
        setParsedData(res.data.data);
        setColumnMapping(res.data.autoMapping || {});
        setDestinos(res.data.destinos || []);
        setStep(3);
      }
    } catch (err) {
      console.error('Error parsing file:', err);
      setError(err.response?.data?.error || 'Error al parsear el archivo. Verifica el formato.');
    } finally {
      setLoading(false);
    }
  };

  // Importar datos
  const handleImport = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const res = await api.post(`/upload/importar/${selectedEntity}`, {
        data: parsedData,
        mapping: columnMapping
      });
      
      setSuccess(`¡Éxito! Se importaron ${res.data.importados || parsedData.length} registros correctamente.`);
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al importar datos');
    } finally {
      setLoading(false);
    }
  };

  const getEntityFields = () => ENTITY_FIELDS[selectedEntity]?.fields || [];

  const reset = () => {
    setFile(null);
    setParsedData([]);
    setColumnMapping({});
    setFileColumns([]);
    setStep(1);
    setError(null);
    setSuccess(null);
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="space-y-6" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', padding: '24px' }}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Carga de Datos</h1>
        <p className="text-gray-500">
          {mode === 'individual' ? 'Ingresa equipos de forma individual' : 'Importa datos desde archivos Excel o CSV'}
        </p>
      </div>

      {/* Tabs para seleccionar modo */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => { setMode('individual'); clearMessages(); }}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium transition-colors ${
            mode === 'individual'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <User className="w-5 h-5" />
          Carga Individual
        </button>
        <button
          onClick={() => { setMode('masiva'); clearMessages(); setStep(1); }}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium transition-colors ${
            mode === 'masiva'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText className="w-5 h-5" />
          Importación Masiva
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-600 flex items-center gap-2">
            <Check className="w-5 h-5" />
            {success}
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </p>
        </div>
      )}

      {/* MODE: CARGA INDIVIDUAL */}
      {mode === 'individual' && (
        <IndividualForm 
          formData={formData}
          formErrors={formErrors}
          destinos={destinos}
          submitting={submitting}
          onChange={handleFormChange}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* MODE: IMPORTACIÓN MASIVA */}
      {mode === 'masiva' && (
        <>
          {/* Pasos */}
          <div className="flex items-center justify-center gap-4">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {step > s ? <Check className="w-5 h-5" /> : s}
                </div>
                {s < 4 && (
                  <div className={`w-16 h-1 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Paso 1: Seleccionar tipo de entidad */}
          {step === 1 && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">Selecciona el tipo de datos a importar</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(ENTITY_FIELDS).map(([key, entity]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedEntity(key)}
                    className={`p-6 rounded-lg border-2 transition-all ${
                      selectedEntity === key 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-4xl mb-2">{entity.icon}</div>
                    <div className="font-semibold text-lg">{entity.label}</div>
                    <div className="text-sm text-gray-500">{entity.fields.length} campos</div>
                  </button>
                ))}
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Continuar <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Paso 2: Subir archivo */}
          {step === 2 && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">Sube tu archivo Excel o CSV</h2>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload-carga"
                />
                <label htmlFor="file-upload-carga" className="cursor-pointer">
                  <FileSpreadsheet className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-700">
                    {file ? file.name : 'Haz clic para seleccionar un archivo'}
                  </p>
                  <p className="text-gray-500 mt-2">Formatos aceptados: CSV, XLSX, XLS</p>
                </label>
              </div>
              
              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Campos de {ENTITY_FIELDS[selectedEntity].label}:</h3>
                <div className="flex flex-wrap gap-2">
                  {getEntityFields().map(field => (
                    <span 
                      key={field.key}
                      className={`px-3 py-1 rounded-full text-sm ${
                        field.required 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {field.label} {field.required && '*'}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Atrás
                </button>
              </div>
            </div>
          )}

          {/* Paso 3: Mapear columnas */}
          {step === 3 && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">Mapea las columnas del archivo</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Campo del Sistema</th>
                      <th className="px-4 py-2 text-center text-sm font-semibold text-gray-600">Requiere</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Columna del Archivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getEntityFields().map(field => (
                      <tr key={field.key} className="border-t">
                        <td className="px-4 py-3">
                          <span className="font-medium">{field.label}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {field.required && (
                            <span className="text-red-500 text-sm">*</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={columnMapping[field.key] || ''}
                            onChange={(e) => setColumnMapping({...columnMapping, [field.key]: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          >
                            <option value="">-- Seleccionar columna --</option>
                            {fileColumns.map(col => (
                              <option key={col} value={col}>{col}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Vista previa de datos con destinos resueltos */}
              {parsedData.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-2">Vista previa - Datos organizados (primeras 5 filas):</h3>
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">N° Inventario</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">N/S</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">Tipo</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">Destino</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedData.slice(0, 5).map((row, idx) => (
                          <tr key={idx} className="border-t hover:bg-gray-50">
                            <td className="px-3 py-2 whitespace-nowrap font-mono text-xs">
                              {row.n_inventario || '-'}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap font-mono text-xs">
                              {row.ns_serial || '-'}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              {row.tipo_equipo || '-'}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              {row.destino_nombre ? (
                                <span 
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                                  style={{ 
                                    backgroundColor: row.destino_color ? row.destino_color + '20' : '#e5e7eb',
                                    color: row.destino_color || '#374151'
                                  }}
                                >
                                  {row.destino_color && (
                                    <span 
                                      className="w-2 h-2 rounded-full" 
                                      style={{ backgroundColor: row.destino_color }}
                                    />
                                  )}
                                  {row.destino_nombre}
                                </span>
                              ) : (
                                <span className="text-gray-400">Sin asignar</span>
                              )}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              {row.estado || 'Activo'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Total de filas: {parsedData.length}
                  </p>
                </div>
              )}
              
              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Atrás
                </button>
                <button
                  onClick={handleImport}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Importando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Importar Datos
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Paso 4: Resultado */}
          {step === 4 && (
            <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
              <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">¡Importación completada!</h2>
              <p className="text-gray-500 mb-6">{success}</p>
              
              <div className="flex justify-center gap-4">
                <button
                  onClick={reset}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Importar más datos
                </button>
                <a
                  href="/equipos"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Ver Equipos
                </a>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Componente: Formulario de Carga Individual
const IndividualForm = ({ formData, formErrors, destinos, submitting, onChange, onSubmit }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h2 className="text-lg font-semibold mb-4">Nuevo Equipo</h2>
      
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* N° Orden */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">N° Orden</label>
            <input
              type="text"
              name="n_orden"
              value={formData.n_orden}
              onChange={onChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="ORD-001"
            />
          </div>

          {/* N° Inventario - REQUERIDO */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              N° Inventario <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="n_inventario"
              value={formData.n_inventario}
              onChange={onChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                formErrors.n_inventario ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="INV-2024-001"
            />
            {formErrors.n_inventario && (
              <p className="text-red-500 text-sm mt-1">{formErrors.n_inventario}</p>
            )}
          </div>

          {/* Catálogo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catálogo</label>
            <input
              type="text"
              name="catalogo"
              value={formData.catalogo}
              onChange={onChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="MOTOTRBO XPR7550"
            />
          </div>

          {/* N/S Serial - REQUERIDO */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              N/S Serial <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="ns_serial"
              value={formData.ns_serial}
              onChange={onChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                formErrors.ns_serial ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="SN12345678"
            />
            {formErrors.ns_serial && (
              <p className="text-red-500 text-sm mt-1">{formErrors.ns_serial}</p>
            )}
          </div>

          {/* GEBIPA */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GEBIPA</label>
            <input
              type="text"
              name="gebipa"
              value={formData.gebipa}
              onChange={onChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="PZBP-001"
            />
          </div>

          {/* Tipo de Equipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Equipo</label>
            <select
              name="tipo_equipo"
              value={formData.tipo_equipo}
              onChange={onChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Equipo">Equipo</option>
              <option value="HT APX 2000">HT APX 2000</option>
              <option value="APX 2500">APX 2500</option>
              <option value="APX 900">APX 900</option>
              <option value="Batería">Batería</option>
              <option value="CARGADOR HT APX 2000">CARGADOR HT APX 2000</option>
              <option value="CARGADOR MULTIPLE 6 BATERIAS">CARGADOR MULTIPLE 6 BATERIAS</option>
            </select>
          </div>

          {/* Frecuencia - solo para equipos HT */}
          {['HT APX 2000', 'APX 2500', 'APX 900'].includes(formData.tipo_equipo) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia</label>
              <select
                name="frecuencia"
                value={formData.frecuencia}
                onChange={onChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Seleccionar frecuencia --</option>
                <option value="VHF-062A">VHF-062A</option>
                <option value="UHF-005A">UHF-005A</option>
              </select>
            </div>
          )}

          {/* ID Cargador - solo para cargadores */}
          {['CARGADOR HT APX 2000', 'CARGADOR MULTIPLE 6 BATERIAS'].includes(formData.tipo_equipo) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID Cargador</label>
              <select
                name="charger_id"
                value={formData.charger_id}
                onChange={onChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Seleccionar cargador --</option>
                <option value="CAR-011">CAR-011</option>
                <option value="CAR-015">CAR-015</option>
                <option value="MIC-001">MIC-001</option>
              </select>
            </div>
          )}

          {/* Cantidad - solo para cargadores */}
          {['CARGADOR HT APX 2000', 'CARGADOR MULTIPLE 6 BATERIAS'].includes(formData.tipo_equipo) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
              <input
                type="number"
                name="cantidad"
                value={formData.cantidad}
                onChange={onChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="1"
              />
            </div>
          )}

          {/* Destino */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Destino</label>
            <select
              name="destino_id"
              value={formData.destino_id}
              onChange={onChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Seleccionar destino --</option>
              {destinos.map(d => (
                <option key={d.id} value={d.id}>{d.nombre}</option>
              ))}
            </select>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              name="estado"
              value={formData.estado}
              onChange={onChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
              <option value="Mantenimiento">Mantenimiento</option>
              <option value="Dado de Baja">Dado de Baja</option>
            </select>
          </div>
        </div>

        {/* Observaciones */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
          <textarea
            name="observaciones"
            value={formData.observaciones}
            onChange={onChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Observaciones adicionales..."
          />
        </div>

        {/* Botón de envío */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Guardando...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Guardar Equipo
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Carga;
