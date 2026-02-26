import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import api from '../services/api';
import { Radio, Battery, Zap, RefreshCw, ArrowRight, Activity, Clock, TrendingUp, Package, AlertCircle, CheckCircle } from 'lucide-react';

// Import new UI components
import { KPICard, DashboardSkeleton } from '../components/ui';

// Corporate color palette - Material Design 3
const COLORS = {
  primary: '#1E40AF',      // Deep blue
  secondary: '#3B82F6',     // Blue
  accent: '#60A5FA',       // Light blue
  success: '#10B981',      // Emerald
  warning: '#F59E0B',       // Amber
  danger: '#EF4444',       // Red
  info: '#0891B2',         // Cyan
  dark: '#1F2937',         // Gray 800
  muted: '#6B7280',        // Gray 500
  background: '#F8FAFC',   // Slate 50
  light: '#F3F4F6',        // Gray 100
};

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
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={fetchDashboardData} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const { contadores, distribucionPorDestino, ultimosMovimientos } = data;
  const totalItems = contadores.totalEquipos + contadores.totalBaterias + contadores.totalBases;

  // Prepare chart data
  const distributionData = distribucionPorDestino.map((dest, index) => ({
    name: dest.nombre,
    value: dest.cantidad,
    radios: dest.radios,
    baterias: dest.baterias,
    bases: dest.bases,
    color: [COLORS.primary, COLORS.secondary, COLORS.success, COLORS.warning, COLORS.danger, COLORS.info][index % 6]
  })).filter(d => d.value > 0);

  const typeData = [
    { name: 'Equipos', value: contadores.totalRadios, color: COLORS.primary },
    { name: 'Baterías', value: contadores.totalBaterias, color: COLORS.success },
    { name: 'Bases', value: contadores.totalBases, color: COLORS.warning }
  ].filter(d => d.value > 0);

  // Top destinations
  const topDestinos = [...distribucionPorDestino]
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 5);

  // Today's movements
  const todayMovements = ultimosMovimientos.filter(m => 
    new Date(m.fecha_movimiento).toDateString() === new Date().toDateString()
  ).length;

  return (
    <div className="space-y-6" style={{ backgroundColor: COLORS.background, minHeight: '100vh', padding: '24px' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Panel de Control</h1>
          <p className="text-gray-500 mt-1">Resumen ejecutivo del inventario</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            Última actualización: {new Date().toLocaleString('es-AR')}
          </span>
          <button
            onClick={fetchDashboardData}
            className="p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all"
            title="Actualizar"
          >
            <RefreshCw className="w-5 h-5 text-blue-600" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Total Inventario" 
          value={totalItems} 
          icon={Package}
          color="primary"
          subtitle="Equipos registrados"
          trend="up"
          trendValue="+12%"
        />
        <KPICard 
          title="Equipos de Radio" 
          value={contadores.totalRadios} 
          icon={Radio}
          color="primary"
          subtitle="Equipos activos"
          trend="up"
          trendValue="+5%"
        />
        <KPICard 
          title="Baterías" 
          value={contadores.totalBaterias} 
          icon={Battery}
          color="success"
          subtitle="En inventario"
          trend="up"
          trendValue="+8%"
        />
        <KPICard 
          title="Bases Cargadoras" 
          value={contadores.totalBases} 
          icon={Zap}
          color="warning"
          subtitle="Disponibles"
          trend="neutral"
          trendValue="+3%"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Destinos Activos</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">{distribucionPorDestino.length}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-3 text-sm text-green-600">
            ✓ Sistema operativo
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Movimientos Hoy</p>
              <p className="text-2xl font-bold text-green-700 mt-1">{todayMovements}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-500">
            Última actividad registrada
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-cyan-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Promedio por Destino</p>
              <p className="text-2xl font-bold text-cyan-700 mt-1">
                {distribucionPorDestino.length > 0 ? Math.round(totalItems / distribucionPorDestino.length) : 0}
              </p>
            </div>
            <div className="p-3 bg-cyan-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-cyan-600" />
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-500">
            Equipos promedio
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution Chart */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Distribución por Destino
          </h2>
          {distributionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={120}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={true}
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: 'none', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              No hay datos disponibles
            </div>
          )}
        </div>

        {/* Types Chart */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Tipos de Equipos
          </h2>
          {typeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={typeData} layout="vertical" barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" stroke={COLORS.muted} />
                <YAxis dataKey="name" type="category" width={100} stroke={COLORS.muted} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: 'none', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} label={{ position: 'right', fill: COLORS.muted }}>
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

      {/* Top Destinations Ranking */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          🏆 Top 5 Destinos con Más Equipos
        </h2>
        <div className="space-y-3">
          {topDestinos.map((destino, index) => (
            <div 
              key={destino.id} 
              className="flex items-center justify-between p-4 rounded-lg"
              style={{ 
                backgroundColor: index === 0 ? '#FEF3C7' : 
                               index === 1 ? '#F3F4F6' : 
                               index === 2 ? '#FEE2E2' : '#F8FAFC'
              }}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                  index === 0 ? 'bg-yellow-500' : 
                  index === 1 ? 'bg-gray-400' : 
                  index === 2 ? 'bg-orange-400' : 'bg-blue-500'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{destino.nombre}</p>
                  <p className="text-sm text-gray-500">
                    {destino.radios} radios • {destino.baterias} baterías • {destino.bases} bases
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-700">{destino.cantidad}</p>
                <p className="text-xs text-gray-500">equipos</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Distribution Table */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          📊 Detalle Completo por Destino
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: COLORS.primary }}>
                <th className="text-left p-4 text-white font-semibold rounded-tl-lg">Destino</th>
                <th className="text-right p-4 text-white font-semibold">Total</th>
                <th className="text-right p-4 text-white font-semibold">Radios</th>
                <th className="text-right p-4 text-white font-semibold">Baterías</th>
                <th className="text-right p-4 text-white font-semibold">Bases</th>
                <th className="text-right p-4 text-white font-semibold rounded-tr-lg">Acción</th>
              </tr>
            </thead>
            <tbody>
              {distribucionPorDestino.map((destino, index) => (
                <tr 
                  key={destino.id} 
                  className="border-b hover:bg-gray-50 transition-colors"
                  style={{ backgroundColor: index % 2 === 0 ? 'white' : '#F8FAFC' }}
                >
                  <td className="p-4">
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded-full mr-3" 
                        style={{ backgroundColor: destino.color }}
                      />
                      <span className="font-semibold text-gray-900">{destino.nombre}</span>
                    </div>
                  </td>
                  <td className="text-right p-4 font-bold text-lg text-blue-700">{destino.cantidad}</td>
                  <td className="text-right p-4">
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
                      {destino.radios}
                    </span>
                  </td>
                  <td className="text-right p-4">
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700">
                      {destino.baterias}
                    </span>
                  </td>
                  <td className="text-right p-4">
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-50 text-yellow-700">
                      {destino.bases}
                    </span>
                  </td>
                  <td className="text-right p-4">
                    <Link 
                      to={`/destinos/${destino.id}`}
                      className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      Ver <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: COLORS.light }}>
                <td className="p-4 font-bold rounded-bl-lg text-blue-800">TOTALES</td>
                <td className="text-right p-4 font-bold text-lg text-blue-800">{totalItems}</td>
                <td className="text-right p-4 font-semibold text-blue-700">{contadores.totalRadios}</td>
                <td className="text-right p-4 font-semibold text-green-700">{contadores.totalBaterias}</td>
                <td className="text-right p-4 font-semibold text-yellow-700">{contadores.totalBases}</td>
                <td className="text-right p-4 rounded-br-lg"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Recent Movements Timeline */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            📈 Últimos Movimientos
          </h2>
          <Link 
            to="/historial" 
            className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Ver todos <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        {ultimosMovimientos.length > 0 ? (
          <div className="space-y-3">
            {ultimosMovimientos.slice(0, 8).map((mov) => (
              <div 
                key={mov.id} 
                className="flex items-center justify-between p-4 rounded-lg border-l-4 bg-gray-50"
                style={{ 
                  borderLeftColor: mov.tipo_movimiento === 'Alta' ? '#10B981' : 
                                 mov.tipo_movimiento === 'Traslado' ? '#3B82F6' : 
                                 mov.tipo_movimiento === 'Baja' ? '#EF4444' : '#F59E0B'
                }}
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="p-2 rounded-full"
                    style={{ 
                      backgroundColor: mov.tipo_movimiento === 'Alta' ? '#ECFDF5' : 
                                     mov.tipo_movimiento === 'Traslado' ? '#EFF6FF' : 
                                     mov.tipo_movimiento === 'Baja' ? '#FEF2F2' : '#FFFBEB'
                    }}
                  >
                    <Activity 
                      className="w-5 h-5"
                      style={{ 
                        color: mov.tipo_movimiento === 'Alta' ? '#10B981' : 
                               mov.tipo_movimiento === 'Traslado' ? '#3B82F6' : 
                               mov.tipo_movimiento === 'Baja' ? '#EF4444' : '#F59E0B'
                      }} 
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {mov.tipo_movimiento}: {mov.n_inventario}
                    </p>
                    <p className="text-sm text-gray-500">
                      {mov.destino_origen_nombre} <span className="text-blue-500">→</span> {mov.destino_nuevo_nombre}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700">{mov.usuario_nombre}</p>
                  <p className="text-xs flex items-center justify-end text-gray-500">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(mov.fecha_movimiento).toLocaleString('es-AR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-lg font-medium text-gray-500">No hay movimientos recientes</p>
            <p className="text-sm text-gray-400">Los movimientos de inventario aparecerán aquí</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
