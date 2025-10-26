// AdminDashboard.js
// VERSI UNDO (Tanpa Editor Booklet, tapi dengan Tab Pengaturan URL)
// Dengan perbaikan kecil di blok catch fetchPatients DAN console.log untuk onLoginSuccess

import React, { useState, useEffect } from 'react';
import PatientTable from './PatientTable';
import AddPatientForm from './AddPatientForm';
import Login from './Login';
import UserManagement from './UserManagement';
// HAPUS: import BookletEditor from './BookletEditor';
import SettingsPage from './SettingsPage';   // <-- Tetap di-import
import './AdminDashboard.css';
import axios from 'axios';

const PATIENTS_PER_PAGE = 20;

const AdminDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState('patients'); // 'patients', 'users', 'settings'
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalPatients, setTotalPatients] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('TimestampDibuat');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [patientBaseUrl, setPatientBaseUrl] = useState('https://ebookletv1.netlify.app/pasien/'); // Default

  const can = (permission) => {
      if (!user || !user.permissions) return false;
      if (user.permissions.all_access) return true;
      return user.permissions[permission] === true;
  };

  useEffect(() => { checkAuthStatus(); }, []);

  useEffect(() => {
    if (isAuthenticated) {
        fetchPatientBaseUrl();
        if (activeTab === 'patients') {
             fetchPatients(currentPage);
        }
    }
  }, [ isAuthenticated, activeTab, currentPage, refreshTrigger, searchQuery, filterStatus, sortBy, sortOrder ]);

  const checkAuthStatus = () => {
    const token = localStorage.getItem('admin_token');
    const userData = localStorage.getItem('user_data');
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        setIsAuthenticated(true);
        setUser(user);
        setActiveTab('patients');
      } catch (error) { clearAuthData(); }
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
    setLoading(false);
    setAuthChecked(true);
  };

  const clearAuthData = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('user_data');
    setIsAuthenticated(false);
    setUser(null);
    setPatients([]);
  };

  const handleLoginSuccess = (data) => {
    if (data.token && data.user) {
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('user_data', JSON.stringify(data.user));
      setIsAuthenticated(true);
      setUser(data.user);
      setCurrentPage(1);
      setSearchQuery('');
      setFilterStatus('');
      setSortBy('TimestampDibuat');
      setSortOrder('DESC');
      setActiveTab('patients');
      setAuthChecked(true);
    } else { alert('Login response invalid.'); }
  };

  const handleLogout = () => { clearAuthData(); setAuthChecked(true); };

  const fetchPatientBaseUrl = async () => {
      try {
          const token = localStorage.getItem('admin_token');
          if (!token) return;
          const response = await axios.get('/.netlify/functions/get-setting?key=patient_base_url', {
              headers: { Authorization: `Bearer ${token}` }
          });
          if (response.data.value) {
              setPatientBaseUrl(response.data.value); // Update state URL
              console.log("Patient Base URL loaded:", response.data.value);
          }
      } catch (err) { console.error("Failed fetch patient base URL:", err); }
  };

  const fetchPatients = async (page) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) throw new Error('No auth token');
      const params = new URLSearchParams({
        page, limit: PATIENTS_PER_PAGE, search: searchQuery,
        filterStatus, sortBy, sortOrder
      });
      const response = await axios.get(
        `/.netlify/functions/get-all-patients?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }
      );
      if (response.data?.patients) {
        setPatients(response.data.patients);
        setTotalPages(response.data.pagination?.totalPages || 1);
        setCurrentPage(response.data.pagination?.page || 1);
        setTotalPatients(response.data.pagination?.total || 0);
      } else { throw new Error('Invalid response format'); }
    } catch (error) {
      console.error('💥 Error fetching patients:', error);
      let errorMessage = error.response?.data?.error || error.message || 'Terjadi kesalahan tidak diketahui';
      if (error.response?.status === 401) {
        errorMessage = 'Sesi Anda telah berakhir, silakan login kembali.';
        clearAuthData();
      }
      setError(errorMessage);
    } finally { setLoading(false); }
  };

  const handleSearchChange = (e) => { setSearchQuery(e.target.value); setCurrentPage(1); };
  const handleFilterChange = (e) => { setFilterStatus(e.target.value); setCurrentPage(1); };
  const handleSortChange = (e) => {
    const [newSortBy, newSortOrder] = e.target.value.split(',');
    setSortBy(newSortBy); setSortOrder(newSortOrder); setCurrentPage(1);
  };
  const handleRefresh = () => { setRefreshTrigger(prev => prev + 1); };
  const handleAddPatient = () => { if (!can('add_patient')) { alert('Akses ditolak'); return; } setEditingPatient(null); setShowForm(true); };
  const handleEditPatient = (patient) => { if (!can('edit_patient')) { alert('Akses ditolak'); return; } setEditingPatient(patient); setShowForm(true); };

  const handleDeletePatient = async (nomorMR) => {
    if (!can('delete_patient')) { alert('Akses ditolak'); return; }
    if (!window.confirm('Yakin hapus pasien ini?')) return;
    try {
      const token = localStorage.getItem('admin_token');
      await axios.delete('/.netlify/functions/delete-patient', {
        headers: { Authorization: `Bearer ${token}` }, data: { NomorMR: nomorMR }
      });
      alert('Pasien berhasil dihapus'); handleRefresh();
    } catch (error) { alert('Gagal menghapus: ' + (error.response?.data?.error || error.message)); }
  };

  const handleFormSuccess = () => { setShowForm(false); setEditingPatient(null); handleRefresh(); setCurrentPage(1); };
  const handleFormCancel = () => { setShowForm(false); setEditingPatient(null); };

  const handleExportCSV = async () => {
     if (!can('export_csv')) { alert('Akses ditolak'); return; }
        try {
          const token = localStorage.getItem('admin_token');
          const response = await axios.get('/.netlify/functions/export-to-csv', {
            headers: { Authorization: `Bearer ${token}` }, responseType: 'blob',
          });
          const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = 'data-pasien.csv'; document.body.appendChild(a);
          a.click(); window.URL.revokeObjectURL(url); document.body.removeChild(a);
        } catch (error) { alert('Gagal mengekspor: ' + (error.response?.data?.error || 'Terjadi kesalahan')); }
  };
  const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };
  const handlePrevPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };

  if (loading && !authChecked) { return <div className="loading-container"><div className="loading-spinner"></div><p>Memeriksa autentikasi...</p></div>; }

  // --- Console Log Ditambahkan Di Sini ---
  if (!isAuthenticated) {
    console.log('[AdminDashboard] Rendering Login - Passing onLoginSuccess, type:', typeof handleLoginSuccess); // Log tipe prop
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }
  // --- Akhir Penambahan Console Log ---

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
         <div className="header-info">
          <h1>Admin POC</h1>
          <div className="user-info">
            <span>Welcome, {user?.username} ({user?.role})</span>
            <button onClick={handleLogout} className="btn-logout">Logout</button>
          </div>
        </div>
        <div className="dashboard-actions">
           {can('add_patient') && activeTab === 'patients' && ( <button onClick={handleAddPatient} className="btn-add-patient"> + Tambah Pasien </button> )}
           {can('export_csv') && activeTab === 'patients' && ( <button onClick={handleExportCSV} className="btn-export"> 📊 Export CSV </button> )}
          <div className="tab-navigation">
             {can('view_patients') && ( <button className={`tab-btn ${activeTab === 'patients' ? 'active' : ''}`} onClick={() => setActiveTab('patients')}> 📋 Data Pasien </button> )}
             {can('manage_users') && ( <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}> 👥 Management User </button> )}
             {can('manage_users') && ( <button className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}> ⚙️ Pengaturan </button> )}
          </div>
        </div>
      </div>

       {activeTab === 'patients' && can('view_patients') && (
        <div className="dashboard-controls-bar">
          <div className="control-group"> <label>Cari Pasien (Nama/MR)</label> <input type="search" placeholder="Ketik nama atau No. MR..." value={searchQuery} onChange={handleSearchChange} className="control-search" /> </div>
          <div className="control-group"> <label>Filter Status</label> <select value={filterStatus} onChange={handleFilterChange} className="control-select"> <option value="">Semua Status</option> <option value="Menunggu">Menunggu</option> <option value="Disetujui">Disetujui</option> </select> </div>
          <div className="control-group"> <label>Urutkan Berdasarkan</label> <select value={`${sortBy},${sortOrder}`} onChange={handleSortChange} className="control-select"> <option value="TimestampDibuat,DESC">Terbaru Dibuat</option> <option value="TimestampDibuat,ASC">Terlama Dibuat</option> <option value="JadwalOperasi,DESC">Jadwal Operasi (Terbaru)</option> <option value="JadwalOperasi,ASC">Jadwal Operasi (Terlama)</option> <option value="NamaPasien,ASC">Nama Pasien (A-Z)</option> <option value="NamaPasien,DESC">Nama Pasien (Z-A)</option> </select> </div>
          <div className="control-group"> <label>&nbsp;</label> <button onClick={handleRefresh} className="btn-refresh" title="Refresh Data"> 🔄 Refresh </button> </div>
        </div>
       )}

      {error && (<div className="error-message"><strong>Error:</strong> {error}</div>)}

      <div className="dashboard-content">
        {activeTab === 'patients' && (
          <>
            {!can('view_patients') ? ( <div className="no-access-message"><h3>❌ Akses Ditolak</h3><p>Anda tidak punya izin melihat data pasien.</p></div> ) : (
              <>
                {loading ? ( <div className="loading-container" style={{height: '300px'}}><div className="loading-spinner"></div><p>Memuat data pasien...</p></div> ) : (
                  <PatientTable
                    patients={patients} onEdit={handleEditPatient} onDelete={handleDeletePatient}
                    userPermissions={user?.permissions} currentPage={currentPage}
                    patientsPerPage={PATIENTS_PER_PAGE} patientBaseUrl={patientBaseUrl}
                  />
                )}
                {!loading && totalPages > 0 && (
                  <div className="pagination-controls">
                    <button onClick={handlePrevPage} disabled={currentPage === 1}>&larr; Sebelumnya</button>
                    <span className="pagination-info">Halaman {currentPage} dari {totalPages} (Total {totalPatients} pasien)</span>
                    <button onClick={handleNextPage} disabled={currentPage === totalPages}>Berikutnya &rarr;</button>
                  </div>
                )}
                {!loading && patients.length === 0 && (<div className="no-data">Tidak ada data pasien yang cocok.</div>)}
                {showForm && ( <div className="modal-overlay"><div className="modal-content"><AddPatientForm onSuccess={handleFormSuccess} onCancel={handleFormCancel} editingPatient={editingPatient}/></div></div> )}
              </>
            )}
          </>
        )}

        {activeTab === 'users' && (
            !can('manage_users') ? ( <div className="no-access-message"><h3>❌ Akses Ditolak</h3><p>Hanya Admin yang bisa mengelola user.</p></div> ) : ( <UserManagement currentUser={user} /> )
        )}

        {activeTab === 'settings' && (
            !can('manage_users') ? ( <div className="no-access-message"><h3>❌ Akses Ditolak</h3><p>Hanya Admin yang bisa mengakses pengaturan.</p></div> ) : ( <SettingsPage initialPatientBaseUrl={patientBaseUrl} onUrlChange={fetchPatientBaseUrl} /> )
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;