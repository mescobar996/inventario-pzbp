import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import api from '../services/api';
import { Radio, Battery, Zap, RefreshCw, ArrowRight, Activity, Clock } from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1', '#14B8A6', '#A855F7'];

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard');
      setData(response.data);
    } catch (err) {
      setError('Error al cargar datos del dashboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
        <button onClick={fetchDashboardData} className="btn btn-primary mt-4">
          Reintentar
        </button>
      </div>
    );
  }

  const { contadores, distribucionPorDestino, porEstado, ultimosMovimientos } = data;

  // Preparar datos para gráfico de distribución
  const distributionData = distribucionPorDestino.map((dest) => ({
    name: dest.nombre,
    value: dest.cantidad,
    radios: dest.radios,
    baterias: dest.baterias,
    bases: dest.bases,
    color: dest.color
  })).filter(d => d.value > 0);

  // Preparar datos para gráfico de tipos
  const typeData = [
    { name: 'Equipos', value: contadores.totalRadios, color: '#3B82F6' },
    { name: 'Baterías', value: contadores.totalBaterias, color: '#10B981' },
    { name: 'Bases', value: contadores.totalBases, color: '#F59E0B' }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500">Resumen del inventario</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Actualizar"
        >
          <RefreshCw className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Equipos" 
          value={contadores.totalEquipos} 
          icon={Radio}
          color="bg-blue-500"
        />
        <StatCard 
          title="Radios" 
          value={contadores.totalRadios} 
          icon={Radio}
          color="bg-blue-600"
        />
        <StatCard 
          title="Baterías" 
          value={contadores.totalBaterias} 
          icon={Battery}
          color="bg-green-500"
        />
        <StatCard 
          title="Bases Cargadoras" 
          value={contadores.totalBases} 
          icon={Zap}
          color="bg-yellow-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution by Destination */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Distribución por Destino
          </h2>
          {distributionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              No hay datos disponibles
            </div>
          )}
        </div>

        {/* Equipment Types */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Tipos de Equipos
          </h2>
          {typeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={typeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              No hay datos disponibles
            </div>
          )}
        </div>
      </div>

      {/* Distribution Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Detalle por Destino
        </h2>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Destino</th>
                <th className="text-right">Total</th>
                <th className="text-right">Radios</th>
                <th className="text-right">Baterías</th>
                <th className="text-right">Bases</th>
                <th className="text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {distribucionPorDestino.map((destino) => (
                <tr key={destino.id}>
                  <td>
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: destino.color }}
                      />
                      <span className="font-medium">{destino.nombre}</span>
                    </div>
                  </td>
                  <td className="text-right font-semibold">{destino.cantidad}</td>
                  <td className="text-right">{destino.radios}</td>
                  <td className="text-right">{destino.baterias}</td>
                  <td className="text-right">{destino.bases}</td>
                  <td className="text-right">
                    <Link 
                      to={`/destinos/${destino.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center justify-end"
                    >
                      Ver <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Movements */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Últimos Movimientos
          </h2>
          <Link to="/historial" className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
            Ver todos <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        {ultimosMovimientos.length > 0 ? (
          <div className="space-y-3">
            {ultimosMovimientos.slice(0, 5).map((mov) => (
              <div key={mov.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className={`p-2 rounded-full mr-3 ${
                    mov.tipo_movimiento === 'Alta' ? 'bg-green-100 text-green-600' :
                    mov.tipo_movimiento === 'Traslado' ? 'bg-blue-100 text-blue-600' :
                    mov.tipo_movimiento === 'Baja' ? 'bg-red-100 text-red-600' :
                    'bg-yellow-100 text-yellow-600'
                  }`}>
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {mov.tipo_movimiento}: {mov.n_inventario}
                    </p>
                    <p className="text-xs text-gray-500">
                      {mov.destino_origen_nombre} → {mov.destino_nuevo_nombre}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">{mov.usuario_nombre}</p>
                  <p className="text-xs text-gray-400 flex items-center justify-end">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(mov.fecha_movimiento).toLocaleDateString('es-AR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-4">No hay movimientos recientes</p>
        )}
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
    </div>
  </div>
);

export default Dashboard;
