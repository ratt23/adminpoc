import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PatientTable from './PatientTable';
import AddPatientForm from './AddPatientForm';
import Modal from './Modal';
import './AdminDashboard.css';

const PATIENTS_PER_PAGE = 20;

const AdminDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingPatient, setEditingPatient] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchPatients = async (page) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('admin_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      console.log('Fetching patients for page:', page);
      
      const response = await axios.get(
        `/.netlify/functions/get-all-patients?page=${page}&limit=${PATIENTS_PER_PAGE}`, 
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000
        }
      );
      
      console.log('Patients data received:', response.data);
      
      if (response.data && response.data.patients) {
        setPatients(response.data.patients);
        setTotalPages(response.data.pagination?.totalPages || 1);
        setCurrentPage(response.data.pagination?.page || 1);
      } else {
        throw new Error('Invalid response format');
      }

    } catch (error) {
      console.error('Error fetching patients:', error);
      setError(error.response?.data?.error || error.message);
      
      if (error.response?.status === 401) {
        alert('Sesi telah berakhir, silakan login kembali');
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients(currentPage);
  }, [currentPage, refreshTrigger]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    window.location.href = '/login';
  };
  
  const handleEdit = (patient) => {
    setEditingPatient(patient);
    setShowForm(true);
  };

  const handleDelete = async (nomorMR) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus pasien dengan MR: ${nomorMR}?`)) {
      try {
        const token = localStorage.getItem('admin_token');
        await axios.delete(`/.netlify/functions/delete-patient?NomorMR=${nomorMR}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setRefreshTrigger(prev => prev + 1);
        alert('Data pasien berhasil dihapus');
        
      } catch (error) {
        console.error('Error deleting patient:', error);
        alert('Gagal menghapus data pasien: ' + (error.response?.data?.error || error.message));
      }
    }
  };
  
  const handleCancelForm = () => {
    setShowForm(false);
    setEditingPatient(null);
  };
  
  const handleSuccessForm = () => {
    setShowForm(false);
    setEditingPatient(null);
    setRefreshTrigger(prev => prev + 1);
    setCurrentPage(1);
  };
  
  const handleShowAddForm = () => {
    setEditingPatient(null);
    setShowForm(true);
  };

  const handleExportCSV = async () => {
    if (isExporting) return;
    setIsExporting(true);

    const token = localStorage.getItem('admin_token');
    if (!token) {
      alert('Sesi Anda telah berakhir, silakan login kembali.');
      setIsExporting(false);
      return;
    }

    try {
      const response = await axios.get('/.netlify/functions/export-to-csv', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob', 
      });

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', 'data-pasien.csv');
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Gagal mengekspor data. Coba lagi.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleManualRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    setError(null);
  };

  const handleInitDatabase = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get('/.netlify/functions/init-database', {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Database initialized: ' + response.data.message);
      handleManualRefresh();
    } catch (error) {
      alert('Gagal initialize database: ' + error.message);
    }
  };

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <img src="https://via.placeholder.com/180x40?text=LOGO+RUMAH+SAKIT" alt="Logo" className="logo-placeholder" />
            <h1>Admin E-Booklet</h1>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="dashboard-controls">
          
          <span className="search-placeholder">Pencarian di nonaktifkan (pagination)</span>

          <button 
            onClick={handleShowAddForm}
            className="btn-primary"
          >
            + Tambah Pasien Baru
          </button>

          <button 
            onClick={handleManualRefresh}
            className="btn-refresh"
            title="Refresh Data"
          >
            🔄 Refresh
          </button>

          <button 
            onClick={handleInitDatabase}
            className="btn-secondary"
            title="Initialize Database"
          >
            🗃️ Init DB
          </button>
          
          <button
            onClick={handleExportCSV}
            className="btn-export"
            disabled={isExporting}
          >
            {isExporting ? 'Mengekspor...' : '📁 Export CSV'}
          </button>
        </div>

        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
            <br />
            <small>Pastikan database sudah terinisialisasi dan terkoneksi dengan baik.</small>
          </div>
        )}

        {showForm && (
          <Modal onClose={handleCancelForm}>
            <AddPatientForm 
              onSuccess={handleSuccessForm}
              onCancel={handleCancelForm}
              editingPatient={editingPatient}
            />
          </Modal>
        )}

        {loading ? (
          <div className="loading">Memuat data pasien...</div>
        ) : (
          <PatientTable 
            patients={patients}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        {!loading && totalPages > 0 && (
          <div className="pagination-controls">
            <button 
              onClick={handlePrevPage} 
              disabled={currentPage === 1}
            >
              &larr; Sebelumnya
            </button>
            <span className="pagination-info">
              Halaman {currentPage} dari {totalPages}
            </span>
            <button 
              onClick={handleNextPage} 
              disabled={currentPage === totalPages}
            >
              Berikutnya &rarr;
            </button>
          </div>
        )}

        {!loading && patients.length === 0 && !error && (
          <div className="no-data">
            {currentPage === 1
              ? 'Belum ada data pasien. Klik "Tambah Pasien Baru" untuk memulai.'
              : 'Tidak ada data di halaman ini.'
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;