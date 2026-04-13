import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import AgentDashboard from './pages/AgentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminReports from './pages/AdminReports';
import Purchase from './pages/Purchase';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/buy" element={<Purchase />} />
      <Route path="/agent" element={<AgentDashboard />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/reports" element={<AdminReports />} />
    </Routes>
  );
}

export default App;
