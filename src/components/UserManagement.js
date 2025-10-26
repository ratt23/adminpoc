// UserManagement.js
// VERSI UPGRADE (dengan Hapus User, Edit Role, dan Clear Table)

import React, { useState, useEffect } from 'react';
import './UserManagement.css';

const UserManagement = ({ currentUser }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // State untuk modal ganti password
  const [editingUser, setEditingUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // State untuk modal tambah user
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'exporter'
  });
  
  // State untuk edit role
  const [editingRoleUser, setEditingRoleUser] = useState(null);
  const [newRole, setNewRole] = useState('');

  // --- STATE BARU UNTUK CLEAR ALL PATIENTS ---
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearConfirmationInput, setClearConfirmationInput] = useState('');
  const [isClearing, setIsClearing] = useState(false);
  // ------------------------------------------

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/.netlify/functions/get-all-users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Gagal mengambil data user');
      }
    } catch (err) {
      setError('Terjadi kesalahan jaringan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/.netlify/functions/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: editingUser.username,
          newPassword: newPassword
        })
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(`Password berhasil diubah untuk user: ${editingUser.username}`);
        handleCancelEdit();
        fetchUsers();
      } else {
        setError(data.error || 'Gagal mengubah password');
      }
    } catch (err) {
      setError('Terjadi kesalahan jaringan. Silakan coba lagi.');
    }
  };

  const handleToggleUserStatus = async (user) => {
    if (user.username === currentUser?.username) {
      setError('Tidak bisa menonaktifkan akun sendiri');
      return;
    }
    const action = user.is_active ? 'menonaktifkan' : 'mengaktifkan';
    if (!window.confirm(`Apakah Anda yakin ingin ${action} user ${user.username}?`)) {
      return;
    }
    try {
      setError('');
      setSuccess('');
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/.netlify/functions/toggle-user-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: user.username,
          is_active: !user.is_active
        })
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(`User ${user.username} berhasil ${user.is_active ? 'dinonaktifkan' : 'diaktifkan'}`);
        fetchUsers();
      } else {
        setError(data.error || 'Gagal mengubah status user');
      }
    } catch (err) {
      setError('Terjadi kesalahan jaringan. Silakan coba lagi.');
    }
  };

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (newUser.password !== newUser.confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok');
      return;
    }
    if (newUser.password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }
    if (!newUser.username.trim()) {
      setError('Username harus diisi');
      return;
    }
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/.netlify/functions/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: newUser.username.trim(),
          password: newUser.password,
          role: newUser.role
        })
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(`User ${newUser.username} berhasil dibuat`);
        setShowAddUserForm(false);
        setNewUser({ username: '', password: '', confirmPassword: '', role: 'exporter' });
        fetchUsers();
      } else {
        setError(data.error || 'Gagal membuat user');
      }
    } catch (err) {
      setError('Terjadi kesalahan jaringan. Silakan coba lagi.');
    }
  };

  const handleRoleEditClick = (user) => {
    setEditingRoleUser(user);
    setNewRole(user.role);
    setError('');
    setSuccess('');
  };

  const handleCancelRoleEdit = () => {
    setEditingRoleUser(null);
    setNewRole('');
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    if (!editingRoleUser) return;
    try {
      setError('');
      setSuccess('');
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/.netlify/functions/update-user-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: editingRoleUser.username,
          newRole: newRole
        })
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(`Role untuk ${editingRoleUser.username} berhasil diubah menjadi ${newRole}`);
        handleCancelRoleEdit();
        fetchUsers();
      } else {
        setError(data.error || 'Gagal mengubah role');
      }
    } catch (err) {
      setError('Terjadi kesalahan jaringan. Silakan coba lagi.');
    }
  };

  const handleDeleteUser = async (user) => {
    if (user.username === currentUser?.username) {
      setError('Tidak bisa menghapus akun sendiri');
      return;
    }
    if (!window.confirm(`APAKAH ANDA YAKIN ingin menghapus user ${user.username}? \n\nTindakan ini permanen dan tidak dapat dibatalkan.`)) {
      return;
    }
    try {
      setError('');
      setSuccess('');
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/.netlify/functions/delete-user', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username: user.username })
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(`User ${user.username} berhasil dihapus`);
        fetchUsers();
      } else {
        setError(data.error || 'Gagal menghapus user');
      }
    } catch (err) {
      setError('Terjadi kesalahan jaringan. Silakan coba lagi.');
    }
  };

  // --- HANDLER BARU UNTUK CLEAR ALL PATIENTS ---
  const handleClearAllPatients = async () => {
    if (clearConfirmationInput !== "HAPUS PERMANEN") {
      setError("String konfirmasi salah. Ketik 'HAPUS PERMANEN'.");
      return;
    }

    setIsClearing(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/.netlify/functions/clear-all-patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          confirmation: clearConfirmationInput
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        setShowClearModal(false);
        setClearConfirmationInput('');
        // NOTE: Kita tidak perlu refresh data pasien di sini,
        // tapi data akan kosong saat admin pindah ke tab 'Data Pasien'
      } else {
        setError(data.error || 'Gagal mengosongkan tabel');
      }
    } catch (err) {
      setError('Terjadi kesalahan jaringan. Silakan coba lagi.');
    } finally {
      setIsClearing(false);
    }
  };

  const handleCancelClear = () => {
    setShowClearModal(false);
    setClearConfirmationInput('');
    setError('');
    setSuccess('');
  };
  // ---------------------------------------------

  const formatPermissions = (permissions) => {
    if (!permissions) return '-';
    if (permissions.all_access) return 'Semua Akses';
    const permissionList = [];
    if (permissions.view_patients) permissionList.push('Lihat Pasien');
    if (permissions.add_patient) permissionList.push('Tambah Pasien');
    if (permissions.edit_patient) permissionList.push('Edit Pasien');
    if (permissions.delete_patient) permissionList.push('Hapus Pasien');
    if (permissions.export_csv) permissionList.push('Export CSV');
    return permissionList.length > 0 ? permissionList.join(', ') : 'Tidak ada akses';
  };

  const getRoleDescription = (role) => {
    switch (role) {
      case 'admin': return 'Akses penuh ke semua fitur';
      case 'admin_poc': return 'Akses lengkap kecuali impor data external';
      case 'exporter': return 'Hanya bisa melihat data dan export CSV';
      default: return 'Role tidak dikenali';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Memuat data user...</p>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="user-management-header">
        <div className="header-title">
          <h2>👥 Management User</h2>
          <p>Kelola user dan password sistem e-Booklet</p>
        </div>
        <button 
          onClick={() => setShowAddUserForm(true)}
          className="btn-add-user"
        >
          + Tambah User Baru
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Permissions</th>
              <th>Status</th>
              <th>Tanggal Dibuat</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className={user.username === currentUser?.username ? 'current-user' : ''}>
                <td>
                  <div className="username-cell">
                    {user.username}
                    {user.username === currentUser?.username && <span className="you-badge">(Anda)</span>}
                  </div>
                </td>
                <td>
                  <div className="role-cell">
                    <span className={`role-badge role-${user.role}`}>
                      {user.role}
                    </span>
                    <div className="role-description">
                      {getRoleDescription(user.role)}
                    </div>
                  </div>
                </td>
                <td className="permissions-cell">
                  {formatPermissions(user.permissions)}
                </td>
                <td>
                  <span className={`status-badge ${user.is_active ? 'status-active' : 'status-inactive'}`}>
                    {user.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td>
                  {new Date(user.created_at).toLocaleDateString('id-ID', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      onClick={() => handleEditClick(user)}
                      className="btn-action btn-edit-password"
                      disabled={!user.is_active}
                      title="Ubah Password"
                    >
                      🔑
                    </button>
                    <button 
                      onClick={() => handleRoleEditClick(user)}
                      className="btn-action btn-edit-role"
                      disabled={user.username === currentUser?.username}
                      title="Ubah Role User"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => handleToggleUserStatus(user)}
                      className={`btn-action btn-toggle-status ${user.is_active ? 'btn-lock' : 'btn-unlock'}`}
                      disabled={user.username === currentUser?.username}
                      title={user.is_active ? 'Nonaktifkan User' : 'Aktifkan User'}
                    >
                      {user.is_active ? '🔒' : '🔓'}
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(user)}
                      className="btn-action btn-delete-user"
                      disabled={user.username === currentUser?.username}
                      title="Hapus User"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <div className="no-data">Tidak ada data user yang ditemukan.</div>}
      </div>

      {/* Modal Ubah Password */}
      {editingUser && (
        <div className="modal-overlay" onClick={handleCancelEdit}>
          <div className="modal-content password-modal" onClick={(e) => e.stopPropagation()}>
            <h3>🔐 Ubah Password</h3>
            <div className="user-info-modal">
              <p><strong>User:</strong> {editingUser.username}</p>
            </div>
            
            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label htmlFor="newPassword">Password Baru</label>
                <input
                  type="password" id="newPassword" value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Masukkan password baru (minimal 6 karakter)" required
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Konfirmasi Password</label>
                <input
                  type="password" id="confirmPassword" value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru" required
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={handleCancelEdit} className="btn-cancel">Batal</button>
                <button type="submit" className="btn-submit">💾 Simpan Password</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ubah Role */}
      {editingRoleUser && (
        <div className="modal-overlay" onClick={handleCancelRoleEdit}>
          <div className="modal-content role-modal" onClick={(e) => e.stopPropagation()}>
            <h3>✏️ Ubah Role User</h3>
            <div className="user-info-modal">
              <p><strong>User:</strong> {editingRoleUser.username}</p>
              <p><strong>Role Saat Ini:</strong> {editingRoleUser.role}</p>
            </div>
            
            <form onSubmit={handleUpdateRole}>
              <div className="form-group">
                <label htmlFor="newUserRole">Role Baru</label>
                <select
                  id="newUserRole"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  required
                >
                  <option value="exporter">Exporter (Hanya lihat dan export)</option>
                  <option value="admin_poc">Admin POC (Akses terbatas)</option>
                  <option value="admin">Admin (Akses penuh)</option>
                </select>
                <div className="role-help">
                  {getRoleDescription(newRole)}
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" onClick={handleCancelRoleEdit} className="btn-cancel">Batal</button>
                <button type="submit" className="btn-submit">💾 Simpan Role</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah User Baru */}
      {showAddUserForm && (
        <div className="modal-overlay" onClick={() => setShowAddUserForm(false)}>
          <div className="modal-content add-user-modal" onClick={(e) => e.stopPropagation()}>
            <h3>👤 Tambah User Baru</h3>
            
            <form onSubmit={handleAddUserSubmit}>
              <div className="form-group">
                <label htmlFor="newUsername">Username</label>
                <input
                  type="text" id="newUsername" value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  placeholder="Masukkan username (unik)" required
                />
              </div>
              <div className="form-group">
                <label htmlFor="newUserRole">Role</label>
                <select
                  id="newUserRole" value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  required
                >
                  <option value="exporter">Exporter (Hanya lihat dan export)</option>
                  <option value="admin_poc">Admin POC (Akses terbatas)</option>
                  <option value="admin">Admin (Akses penuh)</option>
                </select>
                <div className="role-help">
                  {getRoleDescription(newUser.role)}
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="newUserPassword">Password</label>
                <input
                  type="password" id="newUserPassword" value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  placeholder="Masukkan password (minimal 6 karakter)" required
                />
              </div>
              <div className="form-group">
                <label htmlFor="newUserConfirmPassword">Konfirmasi Password</label>
                <input
                  type="password" id="newUserConfirmPassword" value={newUser.confirmPassword}
                  onChange={(e) => setNewUser({...newUser, confirmPassword: e.target.value})}
                  placeholder="Ulangi password" required
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowAddUserForm(false)} className="btn-cancel">Batal</button>
                <button type="submit" className="btn-submit">👥 Tambah User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ZONA BERBAHAYA BARU --- */}
      <div className="danger-zone">
        <h4>⚠️ Zona Berbahaya</h4>
        <p>Aksi berikut bersifat permanen dan tidak dapat dibatalkan. Harap berhati-hati.</p>
        <div className="danger-action">
          <div className="danger-info">
            <strong>Kosongkan Semua Data Pasien</strong>
            <span>Menghapus permanen semua data pasien dari tabel <code>patients</code>.</span>
          </div>
          <button 
            className="btn-danger"
            onClick={() => setShowClearModal(true)}
          >
            Hapus Data Pasien
          </button>
        </div>
      </div>

      {/* Modal Konfirmasi Hapus Data Pasien */}
      {showClearModal && (
        <div className="modal-overlay" onClick={handleCancelClear}>
          <div className="modal-content danger-modal" onClick={(e) => e.stopPropagation()}>
            <h3>⚠️ Konfirmasi Hapus Permanen</h3>
            <p>
              Anda akan menghapus **semua** data pasien (termasuk status persetujuan, link, dan tanda tangan).
              Tindakan ini tidak dapat dibatalkan.
            </p>
            <p>
              Untuk melanjutkan, ketik <strong>HAPUS PERMANEN</strong> di bawah ini:
            </p>
            
            <form onSubmit={(e) => { e.preventDefault(); handleClearAllPatients(); }}>
              <div className="form-group">
                <label htmlFor="clearConfirmation">Konfirmasi</label>
                <input
                  type="text" 
                  id="clearConfirmation" 
                  value={clearConfirmationInput}
                  onChange={(e) => setClearConfirmationInput(e.target.value)}
                  placeholder="Ketik 'HAPUS PERMANEN'"
                  autoComplete="off"
                />
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={handleCancelClear}
                  className="btn-cancel"
                  disabled={isClearing}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="btn-submit-danger"
                  disabled={clearConfirmationInput !== "HAPUS PERMANEN" || isClearing}
                >
                  {isClearing ? 'Menghapus...' : 'Saya Mengerti, Hapus Permanen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* --- AKHIR ZONA BERBAHAYA --- */}
    </div>
  );
};

export default UserManagement;