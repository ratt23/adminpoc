// AdminDashboard.js
// VERSI DENGAN PERBAIKAN FINAL UNTUK PROP onLoginSuccess

import React, { useState, useEffect } from 'react';
import PatientTable from './PatientTable';
import AddPatientForm from './AddPatientForm';
import Login from './Login'; // Pastikan Login di-import
import UserManagement from './UserManagement';
import SettingsPage from './SettingsPage';
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
  const [activeTab, setActiveTab] = useState('patients');
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalPatients, setTotalPatients] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('TimestampDibuat');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [patientBaseUrl, setPatientBaseUrl] = useState('https://ebookletv1.netlify.app/pasien/');

  // --- PASTIKAN FUNGSI INI DIDEFINISIKAN DI SCOPE AdminDashboard ---
  const handleLoginSuccess = (data) => {
    console.log('[AdminDashboard] handleLoginSuccess called with data:', data); // Log tambahan
    if (data.token && data.user) {
      try {
        localStorage.setItem('admin_token', data.token);
        localStorage.setItem('user_data', JSON.stringify(data.user));
        setIsAuthenticated(true); // <-- Set state ini penting
        setUser(data.user);
        // Reset state lain setelah login berhasil
        setCurrentPage(1);
        setSearchQuery('');
        setFilterStatus('');
        setSortBy('TimestampDibuat');
        setSortOrder('DESC');
        setActiveTab('patients'); // Arahkan ke tab pasien
        setAuthChecked(true); // Pastikan authChecked juga true
        setError(null); // Hapus error login sebelumnya
        console.log('[AdminDashboard] Authentication state updated.');
      } catch (e) {
        console.error('[AdminDashboard] Error saving auth data:', e);
        setError('Gagal menyimpan data login.');
        clearAuthData(); // Rollback jika gagal simpan
      }
    } else {
       console.error('[AdminDashboard] Invalid login response data received:', data);
       setError('Respons login tidak valid.');
       alert('Login response invalid.'); // Tetap tampilkan alert jika perlu
    }
  };
  // --- AKHIR DEFINISI FUNGSI ---


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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ isAuthenticated, activeTab, currentPage, refreshTrigger, searchQuery, filterStatus, sortBy, sortOrder ]); // Pastikan dependensi benar


  const checkAuthStatus = () => {
    console.log('[AdminDashboard] checkAuthStatus running...');
    const token = localStorage.getItem('admin_token');
    const userData = localStorage.getItem('user_data');
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log('[AdminDashboard] Found token and user data:', parsedUser.username);
        setIsAuthenticated(true);
        setUser(parsedUser);
        // Jangan set activeTab di sini, biarkan useEffect yang handle
      } catch (error) {
         console.error('[AdminDashboard] Error parsing user data, clearing auth.', error);
         clearAuthData();
      }
    } else {
      console.log('[AdminDashboard] No token or user data found.');
      setIsAuthenticated(false);
      setUser(null);
    }
    setLoading(false);
    setAuthChecked(true); // Tandai bahwa pengecekan selesai
  };

  const clearAuthData = () => {
    console.log('[AdminDashboard] clearAuthData called.');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('user_data');
    setIsAuthenticated(false);
    setUser(null);
    setPatients([]);
  };


  const handleLogout = () => { clearAuthData(); setAuthChecked(true); }; // Set authChecked lagi

  const fetchPatientBaseUrl = async () => { /* ... (fungsi ini tetap sama) ... */ };
  const fetchPatients = async (page) => { /* ... (fungsi ini tetap sama) ... */ };
  const handleSearchChange = (e) => { setSearchQuery(e.target.value); setCurrentPage(1); };
  const handleFilterChange = (e) => { setFilterStatus(e.target.value); setCurrentPage(1); };
  const handleSortChange = (e) => { /* ... */ };
  const handleRefresh = () => { setRefreshTrigger(prev => prev + 1); };
  const handleAddPatient = () => { /* ... */ };
  const handleEditPatient = (patient) => { /* ... */ };
  const handleDeletePatient = async (nomorMR) => { /* ... */ };
  const handleFormSuccess = () => { /* ... */ };
  const handleFormCancel = () => { /* ... */ };
  const handleExportCSV = async () => { /* ... */ };
  const handleNextPage = () => { /* ... */ };
  const handlePrevPage = () => { /* ... */ };


  // --- Logika Loading Awal ---
  if (loading) { // Tampilkan loading hanya jika loading=true
      return <div className="loading-container"><div className="loading-spinner"></div><p>Memuat aplikasi...</p></div>;
  }

  // --- Logika Rendering Login vs Dashboard ---
  // Setelah loading selesai, cek authChecked dan isAuthenticated
  if (!authChecked) {
      // Ini seharusnya tidak terjadi jika loading sudah false, tapi sebagai fallback
      return <div className="loading-container"><p>Menyiapkan sesi...</p></div>;
  }

  // Jika pengecekan selesai TAPI tidak terautentikasi -> Render Login
  if (!isAuthenticated) {
      console.log('[AdminDashboard] Rendering Login - Passing onLoginSuccess prop.');
      // --- PASTIKAN PROP DITERUSKAN DENGAN BENAR DI SINI ---
      return <Login onLoginSuccess={handleLoginSuccess} />;
      // --- AKHIR BAGIAN PENTING ---
  }

  // Jika pengecekan selesai DAN terautentikasi -> Render Dashboard
  console.log('[AdminDashboard] Rendering main dashboard for user:', user?.username);
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