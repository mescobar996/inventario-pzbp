import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, Search, FolderKanban, ArrowRight, X } from 'lucide-react';

const Destinos = () => {
  // Component for managing destinos/ubicaciones
  const { usuario } = useAuth();
  const [destinos, setDestinos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [editingDestino, setEditingDestino] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    descripcion: '',
    color: '#3B82F6'
  });

  useEffect(() => {
    fetchDestinos();
  }, []);

  const fetchDestinos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/destinos');
      setDestinos(response.data);
    } catch (err) {
      setError('Error al cargar destinos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDestino) {
        await api.put(`/destinos/${editingDestino.id}`, formData);
      } else {
        await api.post('/destinos', formData);
      }
      fetchDestinos();
      closeModal();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al guardar destino');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await api.delete(`/destinos/${deleteId}`);
      fetchDestinos();
      setShowDeleteModal(false);
      setDeleteId(null);
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.message || 'Error al eliminar destino');
    }
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const openModal = (destino = null) => {
    if (destino) {
      setEditingDestino(destino);
      setFormData({
        nombre: destino.nombre,
        codigo: destino.codigo,
        descripcion: destino.descripcion || '',
        color: destino.color
      });
    } else {
      setEditingDestino(null);
      setFormData({
        nombre: '',
        codigo: '',
        descripcion: '',
        color: '#3B82F6'
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingDestino(null);
  };

  const filteredDestinos = destinos.filter(d => 
    d.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isAdmin = usuario?.rol === 'admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Destinos</h1>
          <p className="text-gray-500">Gestión de destinos y ubicaciones</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => openModal()}
            className="btn btn-primary flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nuevo Destino
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar destinos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Destinos Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredDestinos.map((destino) => (
          <div 
            key={destino.id}
            className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center mr-3"
                  style={{ backgroundColor: destino.color + '20' }}
                >
                  <FolderKanban 
                    className="w-5 h-5" 
                    style={{ color: destino.color }} 
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{destino.nombre}</h3>
                  <p className="text-xs text-gray-500">{destino.codigo}</p>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {destino.descripcion || 'Sin descripción'}
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <Link
                to={`/destinos/${destino.id}`}
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
              >
                Ver equipos <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
              
              {isAdmin && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openModal(destino)}
                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => confirmDelete(destino.id)}
                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredDestinos.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          {searchTerm ? 'No se encontraron destinos' : 'No hay destinos registrados'}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">
                {editingDestino ? 'Editar Destino' : 'Nuevo Destino'}
              </h2>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código *
                </label>
                <input
                  type="text"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                  className="input"
                  required
                  maxLength={10}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="input"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="input flex-1"
                  />
                </div>
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
                  {editingDestino ? 'Guardar Cambios' : 'Crear Destino'}
                </button>
              </div>
            </form>
          </div>
        </div>
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
                ¿Estás seguro de eliminar este destino? Esta acción no se puede deshacer.
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

export default Destinos;
