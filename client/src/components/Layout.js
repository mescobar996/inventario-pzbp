import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Radio, 
  History, 
  LogOut, 
  Menu, 
  X,
  Settings,
  User
} from 'lucide-react';

const Layout = ({ children }) => {
  const { usuario, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/destinos', icon: FolderKanban, label: 'Destinos' },
    { path: '/equipos', icon: Radio, label: 'Equipos' },
    { path: '/historial', icon: History, label: 'Historial' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-[#1E3A5F] text-white transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-blue-800">
          <h1 className="text-xl font-bold">Inventario PZBP</h1>
          <p className="text-xs text-blue-300">Gestión de Radio-comunicación</p>
        </div>

        <nav className="mt-4 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-4 py-3 mb-1 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-blue-100 hover:bg-blue-800'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-blue-800">
          <div className="flex items-center mb-3">
            <User className="w-8 h-8 bg-blue-600 rounded-full p-1" />
            <div className="ml-3">
              <p className="text-sm font-medium">{usuario?.nombre_completo || usuario?.username}</p>
              <p className="text-xs text-blue-300 capitalize">{usuario?.rol}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-blue-100 hover:bg-blue-800 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-3 lg:px-6">
            <button
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex-1 lg:flex-none" />

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 hidden sm:block">
                {usuario?.nombre_completo || usuario?.username}
              </span>
              <span className={`px-2 py-1 text-xs rounded-full ${
                usuario?.rol === 'admin' 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {usuario?.rol === 'admin' ? 'Admin' : 'Observador'}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
