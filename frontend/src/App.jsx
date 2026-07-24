import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthForm from './components/AuthForm';
import Dashboard from './components/Dashboard';
import Equipos from './components/Equipos';
import Actas from './components/Actas';
import Historial from './components/Historial';
import Chat from './components/Chat';

function App() {
  return (
    <Router>
      <Routes>
        {/* Ruta principal: Login / Registro */}
        <Route path="/" element={<AuthForm />} />

        {/* Ruta del Panel de Control principal */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Módulo de Gestión de Equipos */}
        <Route path="/equipos" element={<Equipos />} />

        {/* Módulo de Actas */}
        <Route path="/actas" element={<Actas />} />

        {/* Módulos de Historial y Auditoría */}
        <Route path="/historial" element={<Historial />} />
        <Route path="/auditoria" element={<Historial />} />

        {/* Módulo de Chat */}
        <Route path="/chat" element={<Chat />} />

        {/* Redirección automática si la ruta no existe */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;