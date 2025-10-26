// Login.js
// VERSI FINAL (Logo + Teks "Admin POC" dan "SURGICAL PREPARATION GUIDE")
// Dengan console.log dan pengecekan tipe onLoginSuccess

import React, { useState } from 'react';
import './Login.css'; // Pastikan CSS di-import

const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('🔐 Attempting login for:', username);
    // --- Console Log Ditambahkan Di Sini ---
    console.log('[Login Component] Received onLoginSuccess prop, type:', typeof onLoginSuccess); // Log tipe prop yang diterima
    // --- Akhir Penambahan Console Log ---

    if (!username.trim() || !password.trim()) {
      setError('Username dan password harus diisi');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/.netlify/functions/authorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim()
        }),
      });

      const data = await response.json();

      console.log('📨 Login response:', {
        status: response.status,
        ok: response.ok,
        data: data
      });


      if (response.ok) {
        console.log('✅ Login successful, attempting to call onLoginSuccess');
        // --- Pengecekan Tipe Ditambahkan Di Sini ---
        if (typeof onLoginSuccess === 'function') {
           onLoginSuccess(data); // Panggil hanya jika benar-benar fungsi
        } else {
           // Log error kritis jika bukan fungsi
           console.error('CRITICAL ERROR: onLoginSuccess is NOT a function!', onLoginSuccess);
           setError('Terjadi kesalahan internal (code: LJS-OLF) saat memproses login. Silakan hubungi support.');
        }
        // --- Akhir Pengecekan Tipe ---
      } else {
        const errorMsg = data.error || `Login gagal (${response.status})`;
        console.error('❌ Login failed:', errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      console.error('💥 Network error during login:', err);
      // Tambahkan detail error jika ada, untuk debugging
      const networkErrorMsg = err.message ? `: ${err.message}` : '';
      setError(`Koneksi jaringan error${networkErrorMsg}. Silakan coba lagi.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">

        <img
          src="/logobaru.png"
          alt="Logo"
          className="login-logo"
        />

        <h2>Admin POC</h2>
        <h3>SURGICAL PREPARATION GUIDE</h3>

        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              disabled={loading}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="button-spinner"></div>
                Memproses...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>

      </div>
    </div>
  );
};

export default Login;