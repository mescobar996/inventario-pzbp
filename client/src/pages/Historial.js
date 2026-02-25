import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Search, Filter, Calendar, ArrowRight, Activity, Clock, User } from 'lucide-react';

const Historial = () => {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    tipo: '',
    fecha_inicio: '',
    fecha_fin: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchHistorial();
  }, [filtros]);

  const fetchHistorial = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filtros.tipo) params.append('tipo', filtros.tipo);
      if (filtros.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
      if (filtros.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);

      const response = await api.get(`/historial?${params.toString()}`);
      setHistorial(response.data.historial);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTipoColor = (tipo) => {
    switch (tipo) {
      case 'Alta': return 'bg-green-100 text-green-800';
      case 'Traslado': return 'bg-blue-100 text-blue-800';
      case 'Cambio Estado': return 'bg-yellow-100 text-yellow-800';
      case 'Baja': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredHistorial = historial.filter(h => 
    h.n_inventario.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.ns_serial.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.usuario_nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Historial de Movimientos</h1>
        <p className="text-gray-500">Registro de cambios en el inventario</p>
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
            <option value="Alta">Alta</option>
            <option value="Traslado">Traslado</option>
            <option value="Cambio Estado">Cambio Estado</option>
            <option value="Baja">Baja</option>
          </select>

          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={filtros.fecha_inicio}
              onChange={(e) => setFiltros({ ...filtros, fecha_inicio: e.target.value })}
              className="input"
              placeholder="Desde"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={filtros.fecha_fin}
              onChange={(e) => setFiltros({ ...filtros, fecha_fin: e.target.value })}
              className="input"
              placeholder="Hasta"
            />
          </div>
        </div>
      </div>

      {/* Historial List */}
      <div className="bg-white rounded-lg shadow-md">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="spinner"></div>
          </div>
        ) : filteredHistorial.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No hay movimientos registrados
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredHistorial.map((mov) => (
              <div key={mov.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    {/* Icon */}
                    <div className={`p-2 rounded-full ${getTipoColor(mov.tipo_movimiento)}`}>
                      <Activity className="w-5 h-5" />
                    </div>

                    {/* Info */}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTipoColor(mov.tipo_movimiento)}`}>
                          {mov.tipo_movimiento}
                        </span>
                        <span className="font-semibold text-gray-800">
                          {mov.n_inventario}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1">
                        N/S: {mov.ns_serial}
                      </p>

                      {/* Movimiento */}
                      {(mov.destino_origen_nombre || mov.destino_nuevo_nombre) && (
                        <div className="flex items-center mt-2 text-sm text-gray-600">
                          <span>{mov.destino_origen_nombre || 'Sin asignar'}</span>
                          <ArrowRight className="w-4 h-4 mx-2 text-gray-400" />
                          <span>{mov.destino_nuevo_nombre || 'Sin asignar'}</span>
                        </div>
                      )}

                      {mov.observaciones && (
                        <p className="text-xs text-gray-500 mt-1 italic">
                          {mov.observaciones}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="text-right text-sm">
                    <div className="flex items-center text-gray-500">
                      <User className="w-3 h-3 mr-1" />
                      {mov.usuario_nombre}
                    </div>
                    <div className="flex items-center text-gray-400 mt-1">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(mov.fecha_movimiento).toLocaleString('es-AR', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Historial;
