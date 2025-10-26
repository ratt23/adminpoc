// src/App.js (Versi Admin - Sudah Dibersihkan)
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
// HAPUS: import PatientPage from './components/PatientPage';
// HAPUS: import ThankYou from './components/ThankYou';
import './App.css';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('admin_token') !== null;
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Rute Admin */}
          <Route path="/login" element={<Login />} />
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* HAPUS: Rute-rute pasien di bawah ini */}
          {/* <Route path="/pasien/:NomorMR" element={<PatientPage />} /> */}
          {/* <Route path="/terima-kasih" element={<ThankYou />} /> */}
          
          {/* Default redirect ke login */}
          <Route path="/" element={<Navigate to="/login" />} />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;