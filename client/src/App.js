import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Destinos from './pages/Destinos';
import Equipos from './pages/Equipos';
import Historial from './pages/Historial';
import Reportes from './pages/Reportes';
import Layout from './components/Layout';

function PrivateRoute({ children }) {
  const { usuario, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }
  
  return usuario ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/destinos" element={<Destinos />} />
                    <Route path="/destinos/:id" element={<Equipos />} />
                    <Route path="/equipos" element={<Equipos />} />
                    <Route path="/historial" element={<Historial />} />
                    <Route path="/reportes" element={<Reportes />} />
                  </Routes>
                </Layout>
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
