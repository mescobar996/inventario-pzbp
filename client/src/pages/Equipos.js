import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, Edit2, Trash2, Search, Upload, X, ArrowLeft, 
  ArrowRight, AlertCircle, Filter, Grid, List, CheckCircle
} from 'lucide-react';

// Import new UI components
import { 
  EquipmentCard, 
  EquipmentCardCompact, 
  EquipmentListSkeleton, 
  FilterChipGroup,
  FilterChipMulti 
} from '../components/ui';

const Equipos = () => {
  const { id: destinoId } = useParams();
  const { usuario } = useAuth();
  const [equipos, setEquipos] = useState([]);
  const [destinos, setDestinos] = useState([]);
  const [destinoActual, setDestinoActual] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [filtros, setFiltros] = useState({
    tipo: '',
    estado: '',
    destino: destinoId || ''
  });
  const [showModal, setShowModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [editingEquipo, setEditingEquipo] = useState(null);
  const [formData, setFormData] = useState({
    n_orden: '',
    n_inventario: '',
    catalogo: '',
    ns_serial: '',
    gebipa: '',
    tipo_equipo: 'Equipo',
    destino_id: destinoId || '',
    observaciones: '',
    estado: 'Activo'
  });

  useEffect(() => {
    fetchData();
  }, [destinoId, filtros]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch destinos
      const destinosRes = await api.get('/destinos');
      setDestinos(destinosRes.data);

      // Fetch equipos
      const params = new URLSearchParams();
      if (filtros.tipo) params.append('tipo', filtros.tipo);
      if (filtros.estado) params.append('estado', filtros.estado);
      if (filtros.destino) params.append('destino', filtros.destino);
      if (searchTerm) params.append('search', searchTerm);

      const equiposRes = await api.get(`/equipos?${params.toString()}`);
      setEquipos(equiposRes.data.equipos);

      // Get destino actual
      if (destinoId) {
        const destino = destinosRes.data.find(d => d.id === parseInt(destinoId));
        setDestinoActual(destino);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEquipo) {
        await api.put(`/equipos/${editingEquipo.id}`, formData);
      } else {
        await api.post('/equipos', formData);
      }
      
      setShowModal(false);
      setEditingEquipo(null);
      setFormData({
        n_orden: '',
        n_inventario: '',
        catalogo: '',
        ns_serial: '',
        gebipa: '',
        tipo_equipo: 'Equipo',
        destino_id: destinoId || '',
        observaciones: '',
        estado: 'Activo'
      });
      fetchData();
    } catch (err) {
      console.error('Error:', err);
      alert(err.response?.data?.error || 'Error al guardar equipo');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/equipos/${deleteId}`);
      setShowDeleteModal(false);
      setDeleteId(null);
      fetchData();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleEdit = (equipo) => {
    setEditingEquipo(equipo);
    setFormData({
      n_orden: equipo.n_orden || '',
      n_inventario: equipo.n_inventario || '',
      catalogo: equipo.catalogo || '',
      ns_serial: equipo.ns || '',
      gebipa: equipo.gebipa || '',
      tipo_equipo: equipo.tipo || 'Equipo',
      destino_id: equipo.destino_id || '',
      observaciones: equipo.observaciones || '',
      estado: equipo.estado || 'Activo'
    });
    setShowModal(true);
  };

  const handleView = (equipo) => {
    // Could open a detail modal
    console.log('View equipo:', equipo);
  };

  const handleDeleteClick = (equipo) => {
    setDeleteId(equipo.id);
    setShowDeleteModal(true);
  };

  // Filter options
  const tipoOptions = [
    { value: 'Equipo', label: 'Equipos' },
    { value: 'Batería', label: 'Baterías' },
    { value: 'Base Cargadora', label: 'Bases Cargadoras' }
  ];

  const estadoOptions = [
    { value: 'Activo', label: 'Activo' },
    { value: 'Inactivo', label: 'Inactivo' },
    { value: 'Mantenimiento', label: 'Mantenimiento' },
    { value: 'Dado de Baja', label: 'Dado de Baja' }
  ];

  const destinoOptions = destinos.map(d => ({
    value: d.id.toString(),
    label: d.nombre
  }));

  // Filtered equipos for search
  const filteredEquipos = equipos.filter(equipo => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (equipo.n_inventario && equipo.n_inventario.toLowerCase().includes(searchLower)) ||
      (equipo.ns && equipo.ns.toLowerCase().includes(searchLower)) ||
      (equipo.catalogo && equipo.catalogo.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="space-y-6" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', padding: '24px' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          {destinoActual ? (
            <>
              <div className="flex items-center gap-2 mb-1">
                <span 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: destinoActual.color }}
                />
                <h1 className="text-2xl font-bold text-gray-900">{destinoActual.nombre}</h1>
              </div>
              <p className="text-gray-500">Gestión de equipos por destino</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900">Equipos</h1>
              <p className="text-gray-500">Gestión completa del inventario</p>
            </>
          )}
        </div>
        
        <div className="flex gap-2">
          {usuario?.rol === 'Admin' && (
            <>
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
              >
                <Upload className="w-4 h-4" />
                Importar Excel/CSV
              </button>
              <button
                onClick={() => {
                  setEditingEquipo(null);
                  setFormData({
                    n_orden: '',
                    n_inventario: '',
                    catalogo: '',
                    ns_serial: '',
                    gebipa: '',
                    tipo_equipo: 'Equipo',
                    destino_id: destinoId || '',
                    observaciones: '',
                    estado: 'Activo'
                  });
                  setShowModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
              >
                <Plus className="w-4 h-4" />
                Nuevo Equipo
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por número de inventario, serie o catálogo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Vista de grid"
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Vista de lista"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap gap-4">
          <FilterChipGroup
            title="Tipo"
            options={tipoOptions}
            selected={filtros.tipo}
            onChange={(value) => setFiltros({...filtros, tipo: value})}
            color="#3B82F6"
          />
          
          <FilterChipGroup
            title="Estado"
            options={estadoOptions}
            selected={filtros.estado}
            onChange={(value) => setFiltros({...filtros, estado: value})}
            color="#10B981"
          />
          
          {!destinoId && (
            <FilterChipGroup
              title="Destino"
              options={destinoOptions}
              selected={filtros.destino}
              onChange={(value) => setFiltros({...filtros, destino: value})}
              color="#F59E0B"
            />
          )}
          
          {(filtros.tipo || filtros.estado || filtros.destino || searchTerm) && (
            <button
              onClick={() => {
                setFiltros({ tipo: '', estado: '', destino: destinoId || '' });
                setSearchTerm('');
              }}
              className="text-sm text-red-600 hover:text-red-800 underline self-end"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {loading ? 'Cargando...' : `Mostrando ${filteredEquipos.length} de ${equipos.length} equipos`}
        </p>
      </div>

      {/* Equipment Grid/List */}
      {loading ? (
        <EquipmentListSkeleton count={6} />
      ) : filteredEquipos.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredEquipos.map((equipo) => (
              <EquipmentCard
                key={equipo.id}
                equipo={equipo}
                onView={handleView}
                onEdit={usuario?.rol === 'Admin' ? handleEdit : null}
                onDelete={usuario?.rol === 'Admin' ? handleDeleteClick : null}
                showActions={!!usuario?.rol}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredEquipos.map((equipo) => (
              <EquipmentCardCompact
                key={equipo.id}
                equipo={equipo}
                onClick={handleView}
              />
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No se encontraron equipos</h3>
          <p className="text-gray-500">
            {searchTerm || filtros.tipo || filtros.estado || filtros.destino
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Comienza agregando nuevos equipos al inventario'}
          </p>
        </div>
      )}

      {/* Modal for Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingEquipo ? 'Editar Equipo' : 'Nuevo Equipo'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    N° Orden
                  </label>
                  <input
                    type="text"
                    value={formData.n_orden}
                    onChange={(e) => setFormData({...formData, n_orden: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    N° Inventario *
                  </label>
                  <input
                    type="text"
                    value={formData.n_inventario}
                    onChange={(e) => setFormData({...formData, n_inventario: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catálogo
                  </label>
                  <input
                    type="text"
                    value={formData.catalogo}
                    onChange={(e) => setFormData({...formData, catalogo: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    N/S (Serial) *
                  </label>
                  <input
                    type="text"
                    value={formData.ns_serial}
                    onChange={(e) => setFormData({...formData, ns_serial: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GEBIPA
                  </label>
                  <input
                    type="text"
                    value={formData.gebipa}
                    onChange={(e) => setFormData({...formData, gebipa: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo *
                  </label>
                  <select
                    value={formData.tipo_equipo}
                    onChange={(e) => setFormData({...formData, tipo_equipo: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Equipo">Equipo</option>
                    <option value="Batería">Batería</option>
                    <option value="Base Cargadora">Base Cargadora</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado *
                  </label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({...formData, estado: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                    <option value="Mantenimiento">Mantenimiento</option>
                    <option value="Dado de Baja">Dado de Baja</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destino *
                  </label>
                  <select
                    value={formData.destino_id}
                    onChange={(e) => setFormData({...formData, destino_id: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar destino</option>
                    {destinos.map(destino => (
                      <option key={destino.id} value={destino.id}>
                        {destino.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observaciones
                </label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingEquipo(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingEquipo ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Confirmar Eliminación
              </h3>
              <p className="text-gray-500 mb-6">
                ¿Estás seguro de que deseas eliminar este equipo? Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteId(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && <UploadModal onClose={() => setShowUploadModal(false)} onUploadComplete={fetchData} />}
    </div>
  );
};

// Enhanced Upload Modal Component with Excel/CSV support
const UploadModal = ({ onClose, onUploadComplete }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    try {
      setUploading(true);
      setError(null);
      setSuccess(null);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/upload/csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setSuccess(`¡Éxito! Se importaron ${response.data.importados || 'los'} equipos correctamente.`);
      setTimeout(() => {
        onUploadComplete();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al subir archivo. Verifica el formato del archivo.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const getFileExtension = (filename) => {
    return filename.split('.').pop().toLowerCase();
  };

  const isValidFile = (filename) => {
    const ext = getFileExtension(filename);
    return ['csv', 'xlsx', 'xls'].includes(ext);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Importar Equipos</h2>
            <p className="text-sm text-gray-500 mt-1">Desde archivo Excel o CSV</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleUpload} className="space-y-4">
          {/* Drag and Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : file 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center">
                  <div className={`p-3 rounded-full ${isValidFile(file.name) ? 'bg-green-100' : 'bg-red-100'}`}>
                    {isValidFile(file.name) ? (
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    ) : (
                      <AlertCircle className="w-8 h-8 text-red-600" />
                    )}
                  </div>
                </div>
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
                {isValidFile(file.name) ? (
                  <p className="text-sm text-green-600">✓ Formato válido</p>
                ) : (
                  <p className="text-sm text-red-600">✗ Formato no válido. Use CSV, XLSX o XLS</p>
                )}
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Cambiar archivo
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-12 h-12 mx-auto text-gray-400" />
                <p className="text-gray-600">
                  <span className="font-medium text-blue-600">Haz clic para seleccionar</span> o
                  arrastra y suelta
                </p>
                <p className="text-xs text-gray-500">
                  Formatos soportados: CSV, Excel (.xlsx, .xls)
                </p>
              </div>
            )}
            
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setFile(e.target.files[0]);
                }
              }}
              className="hidden"
              id="file-upload"
            />
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">📋 Formato requerido</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>N° Inventario</strong> (obligatorio)</li>
              <li>• <strong>N/S Serial</strong> (obligatorio)</li>
              <li>• <strong>Tipo</strong> (Equipo, Batería, Base Cargadora)</li>
              <li>• <strong>Destino</strong> (nombre del destino)</li>
              <li>• <strong>Catálogo, GEBIPA, Estado, Observaciones</strong> (opcional)</li>
            </ul>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            </div>
          )}
          
          {/* Success Message */}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {success}
              </p>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={uploading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!file || !isValidFile(file.name) || uploading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Importar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Equipos;
