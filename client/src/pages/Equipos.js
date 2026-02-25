import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, Edit2, Trash2, Search, Upload, X, ArrowLeft, 
  ArrowRight, AlertCircle, Check, Filter, Download 
} from 'lucide-react';

const Equipos = () => {
  const { id: destinoId } = useParams();
  const { usuario } = useAuth();
  const [equipos, setEquipos] = useState([]);
  const [destinos, setDestinos] = useState([]);
  const [destinoActual, setDestinoActual] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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
      fetchData();
      closeModal();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al guardar equipo');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await api.delete(`/equipos/${deleteId}`);
      fetchData();
      setShowDeleteModal(false);
      setDeleteId(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar equipo');
    }
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleTrasladar = async (equipoId, nuevoDestinoId) => {
    try {
      await api.patch(`/equipos/${equipoId}/trasladar`, {
        destino_id: nuevoDestinoId
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al trasladar equipo');
    }
  };

  const openModal = (equipo = null) => {
    if (equipo) {
      setEditingEquipo(equipo);
      setFormData({
        n_orden: equipo.n_orden || '',
        n_inventario: equipo.n_inventario,
        catalogo: equipo.catalogo || '',
        ns_serial: equipo.ns_serial,
        gebipa: equipo.gebipa || '',
        tipo_equipo: equipo.tipo_equipo,
        destino_id: equipo.destino_id || '',
        observaciones: equipo.observaciones || '',
        estado: equipo.estado
      });
    } else {
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
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingEquipo(null);
  };

  const isAdmin = usuario?.rol === 'admin';

  const getBadgeClass = (estado) => {
    switch (estado) {
      case 'Activo': return 'badge-success';
      case 'Inactivo': return 'badge-warning';
      case 'Mantenimiento': return 'badge-info';
      case 'Dado de Baja': return 'badge-danger';
      default: return 'badge-info';
    }
  };

  const getTipoIcon = (tipo) => {
    return tipo === 'Equipo' ? '📻' : tipo === 'Batería' ? '🔋' : '⚡';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center">
          {destinoId && (
            <a href="/destinos" className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </a>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {destinoActual ? destinoActual.nombre : 'Equipos'}
            </h1>
            <p className="text-gray-500">
              {destinoActual ? `Gestión de equipos en ${destinoActual.nombre}` : 'Gestión total de equipos'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn btn-secondary flex items-center"
          >
            <Upload className="w-4 h-4 mr-2" />
            Cargar CSV
          </button>
          <button
            onClick={() => openModal()}
            className="btn btn-primary flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nuevo Equipo
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-9"
            />
          </div>
          
          <select
            value={filtros.tipo}
            onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
            className="select"
          >
            <option value="">Todos los tipos</option>
            <option value="Equipo">Equipo</option>
            <option value="Batería">Batería</option>
            <option value="Base Cargadora">Base Cargadora</option>
          </select>

          <select
            value={filtros.estado}
            onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
            className="select"
          >
            <option value="">Todos los estados</option>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
            <option value="Mantenimiento">Mantenimiento</option>
            <option value="Dado de Baja">Dado de Baja</option>
          </select>

          <select
            value={filtros.destino}
            onChange={(e) => setFiltros({ ...filtros, destino: e.target.value })}
            className="select"
          >
            <option value="">Todos los destinos</option>
            {destinos.map(d => (
              <option key={d.id} value={d.id}>{d.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="bg-gray-50">
              <tr>
                <th>N° Inventario</th>
                <th>N/S</th>
                <th>Tipo</th>
                <th>Catálogo</th>
                <th>GEBIPA</th>
                <th>Destino</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8">
                    <div className="spinner mx-auto"></div>
                  </td>
                </tr>
              ) : equipos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    No hay equipos registrados
                  </td>
                </tr>
              ) : (
                equipos.map((equipo) => (
                  <tr key={equipo.id}>
                    <td className="font-medium">{equipo.n_inventario}</td>
                    <td>{equipo.ns_serial}</td>
                    <td>
                      <span className="flex items-center">
                        <span className="mr-2">{getTipoIcon(equipo.tipo_equipo)}</span>
                        {equipo.tipo_equipo}
                      </span>
                    </td>
                    <td>{equipo.catalogo || '-'}</td>
                    <td>{equipo.gebipa || '-'}</td>
                    <td>
                      {equipo.destino ? (
                        <span 
                          className="px-2 py-1 rounded text-xs font-medium text-white"
                          style={{ backgroundColor: equipo.destino.color }}
                        >
                          {equipo.destino.nombre}
                        </span>
                      ) : (
                        <span className="text-gray-400">Sin asignar</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${getBadgeClass(equipo.estado)}`}>
                        {equipo.estado}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openModal(equipo)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        
                        {isAdmin && (
                          <button
                            onClick={() => confirmDelete(equipo.id)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Equipo */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">
                {editingEquipo ? 'Editar Equipo' : 'Nuevo Equipo'}
              </h2>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    N° Orden
                  </label>
                  <input
                    type="text"
                    value={formData.n_orden}
                    onChange={(e) => setFormData({ ...formData, n_orden: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    N° Inventario *
                  </label>
                  <input
                    type="text"
                    value={formData.n_inventario}
                    onChange={(e) => setFormData({ ...formData, n_inventario: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    N/S (Serial) *
                  </label>
                  <input
                    type="text"
                    value={formData.ns_serial}
                    onChange={(e) => setFormData({ ...formData, ns_serial: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catálogo
                  </label>
                  <input
                    type="text"
                    value={formData.catalogo}
                    onChange={(e) => setFormData({ ...formData, catalogo: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GEBIPA
                  </label>
                  <input
                    type="text"
                    value={formData.gebipa}
                    onChange={(e) => setFormData({ ...formData, gebipa: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Equipo
                  </label>
                  <select
                    value={formData.tipo_equipo}
                    onChange={(e) => setFormData({ ...formData, tipo_equipo: e.target.value })}
                    className="select"
                  >
                    <option value="Equipo">Equipo</option>
                    <option value="Batería">Batería</option>
                    <option value="Base Cargadora">Base Cargadora</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destino
                  </label>
                  <select
                    value={formData.destino_id}
                    onChange={(e) => setFormData({ ...formData, destino_id: e.target.value })}
                    className="select"
                  >
                    <option value="">Sin asignar</option>
                    {destinos.map(d => (
                      <option key={d.id} value={d.id}>{d.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    className="select"
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                    <option value="Mantenimiento">Mantenimiento</option>
                    <option value="Dado de Baja">Dado de Baja</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observaciones
                </label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  className="input"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingEquipo ? 'Guardar Cambios' : 'Crear Equipo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal 
          onClose={() => setShowUploadModal(false)} 
          onSuccess={fetchData}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-center mb-2">Confirmar eliminación</h3>
              <p className="text-gray-600 text-center mb-6">
                ¿Estás seguro de eliminar este equipo? Esta acción no se puede deshacer.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteId(null);
                  }}
                  className="flex-1 btn btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 btn btn-danger"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Upload Modal Component
const UploadModal = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        alert('Por favor selecciona un archivo CSV');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      const response = await api.post('/upload/csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(response.data);
      onSuccess();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al subir archivo');
    } finally {
      setUploading(false);
    }
  };

  const downloadPlantilla = async () => {
    try {
      const response = await api.get('/upload/plantilla', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'plantilla_inventario.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Carga Masiva de Equipos</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleUpload} className="p-4 space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                {file ? file.name : 'Seleccionar archivo CSV'}
              </p>
            </label>
          </div>

          <button
            type="button"
            onClick={downloadPlantilla}
            className="text-blue-600 text-sm flex items-center justify-center w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            Descargar plantilla
          </button>

          {result && (
            <div className={`p-3 rounded-lg ${result.errores?.length > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
              <p className="text-sm">{result.message}</p>
              {result.errores?.length > 0 && (
                <details className="mt-2">
                  <summary className="text-sm text-yellow-700 cursor-pointer">
                    Ver errores ({result.errores.length})
                  </summary>
                  <ul className="mt-1 text-xs text-yellow-600">
                    {result.errores.slice(0, 5).map((err, i) => (
                      <li key={i}>{err.error}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cerrar
            </button>
            <button
              type="submit"
              disabled={!file || uploading}
              className="btn btn-primary disabled:opacity-50"
            >
              {uploading ? 'Subiendo...' : 'Subir CSV'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Equipos;
