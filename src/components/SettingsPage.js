// SettingsPage.js (Versi Ringkas - Hanya URL)
// Dengan perbaikan untuk menampilkan nilai default

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SettingsPage.css';

// Menerima initialPatientBaseUrl sebagai prop
const SettingsPage = ({ onUrlChange, initialPatientBaseUrl }) => {
  // Gunakan prop sebagai nilai awal state
  const [patientBaseUrl, setPatientBaseUrl] = useState(initialPatientBaseUrl || '');
  const [isLoading, setIsLoading] = useState(true); // Tetap true awalnya untuk fetch
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [updatedBy, setUpdatedBy] = useState('');

  useEffect(() => {
    // Tetap fetch data asli saat komponen dimuat
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true); // Set loading true saat memulai fetch
    setError('');
    // Jangan hapus success message agar user tahu save terakhir berhasil
    // setSuccess('');
    try {
      const token = localStorage.getItem('admin_token');
      const urlResponse = await axios.get('/.netlify/functions/get-setting?key=patient_base_url', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const fetchedUrl = urlResponse.data.value || '';
      // Update state HANYA jika berbeda dari prop awal (atau jika prop kosong)
      // dan jika tidak sedang dalam proses input oleh user
      if ((fetchedUrl !== patientBaseUrl && !isSaving) || !patientBaseUrl) {
          setPatientBaseUrl(fetchedUrl);
      }
      setLastUpdated(urlResponse.data.last_updated);
      setUpdatedBy(urlResponse.data.last_updated_by || 'Unknown');
      // Panggil callback onUrlChange saat fetch berhasil (jika perlu)
      // if (onUrlChange && fetchedUrl) {
      //   onUrlChange(fetchedUrl); // Kirim URL terbaru ke parent (opsional, tergantung kebutuhan)
      // }
    } catch (err) {
      setError('Gagal memuat pengaturan URL terbaru dari server: ' + (err.response?.data?.error || err.message));
      // Jika fetch gagal, state akan tetap berisi initialPatientBaseUrl
       if (!patientBaseUrl && initialPatientBaseUrl) {
         setPatientBaseUrl(initialPatientBaseUrl); // Fallback ke initial jika state kosong
       }
    } finally {
      setIsLoading(false); // Set loading false setelah selesai fetch (berhasil atau gagal)
    }
  };

  const handleSaveUrl = async () => {
    // Validasi sederhana di frontend
    if (!patientBaseUrl || !patientBaseUrl.trim().startsWith('http') || !patientBaseUrl.trim().endsWith('/')) {
         setError('URL tidak valid. Pastikan URL lengkap (diawali http atau https) dan diakhiri dengan /');
         return;
    }

    setIsSaving(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('admin_token');
      await axios.post('/.netlify/functions/update-setting',
        { key: 'patient_base_url', value: patientBaseUrl.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('URL dasar pasien berhasil disimpan!');
      // Panggil fetch lagi untuk update metadata dan panggil callback
      fetchSettings();
      // Panggil onUrlChange secara eksplisit setelah save berhasil
      if (onUrlChange) {
         onUrlChange(patientBaseUrl.trim());
      }
    } catch (err) {
      setError('Gagal menyimpan URL: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSaving(false);
    }
  };

   const formatTimestamp = (isoString) => {
      if (!isoString) return '-';
      try { return new Date(isoString).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jayapura' }); } catch { return 'Invalid Date'; }
  };

  return (
    <div className="settings-page">
      <h2>⚙️ Pengaturan Aplikasi</h2>

      {/* Tampilkan pesan error/sukses di atas */}
      {error && <div className="error-message settings-error">{error}</div>}
      {success && <div className="success-message settings-success">{success}</div>}

      {/* Tampilkan form SEGERA menggunakan nilai state (yang sudah diinisialisasi dgn prop) */}
      <div className="setting-item">
        <h3>URL Dasar Aplikasi Pasien</h3>
        <p>Masukkan URL lengkap tempat aplikasi pasien di-hosting. URL ini akan digunakan saat membuat link untuk pasien. Pastikan diawali <code>http://</code> atau <code>https://</code> dan diakhiri dengan garis miring (<code>/</code>).</p>
        <div className="setting-input-group">
          <input
            type="url"
            // Tampilkan state saat ini, yang awalnya adalah prop
            value={patientBaseUrl}
            onChange={(e) => setPatientBaseUrl(e.target.value)}
            placeholder="Contoh: https://aplikasi-pasien-anda.netlify.app/pasien/"
            className="setting-input"
            // Tombol save hanya nonaktif saat proses saving
            disabled={isSaving || isLoading} // Juga disable saat loading awal
          />
          <button onClick={handleSaveUrl} disabled={isSaving || isLoading} className="btn-save-setting">
            {isSaving ? 'Menyimpan...' : (isLoading ? 'Memuat...' : '💾 Simpan URL')}
          </button>
        </div>
         {/* Tampilkan metadata jika tidak sedang loading awal */}
         {!isLoading && (
            <div className="setting-metadata">
              Terakhir diubah: {formatTimestamp(lastUpdated)} oleh {updatedBy || 'N/A'}
            </div>
         )}
         {/* Tampilkan loading indicator kecil jika sedang fetching di background */}
         {isLoading && <div className="settings-loading-inline">Memuat data terbaru...</div>}

         <div className="url-warning">
            ⚠️ Mengubah URL ini akan memengaruhi semua link baru yang dibuat. Link lama yang sudah dibagikan tidak akan berubah.
         </div>
      </div>
       {/* Bagian untuk setting lain bisa ditambahkan di sini nanti */}
    </div>
  );
};

export default SettingsPage;