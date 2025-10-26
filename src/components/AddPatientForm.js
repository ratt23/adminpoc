import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AddPatientForm.css';

const AddPatientForm = ({ onSuccess, onCancel, editingPatient }) => {
  const [NomorMR, setNomorMR] = useState('');
  const [NamaPasien, setNamaPasien] = useState('');
  const [JadwalOperasi, setJadwalOperasi] = useState('');
  const [Dokter, setDokter] = useState('');
  
  const [Gender, setGender] = useState('');
  const [Umur, setUmur] = useState('');
  const [Diagnosa, setDiagnosa] = useState('');
  const [Payer, setPayer] = useState('');
  const [Kelas, setKelas] = useState('');
  const [Skala, setSkala] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isEditMode = Boolean(editingPatient);

  useEffect(() => {
    // Fungsi untuk mengosongkan form
    const resetForm = () => {
      setNomorMR('');
      setNamaPasien('');
      setJadwalOperasi('');
      setDokter('');
      setGender('');
      setUmur('');
      setDiagnosa('');
      setPayer('');
      setKelas('');
      setSkala('');
    };

    if (isEditMode) {
      // Isi form saat mode edit
      setNomorMR(editingPatient.NomorMR);
      setNamaPasien(editingPatient.NamaPasien);
      
      // --- PERBAIKAN FORMAT TANGGAL SAAT EDIT ---
      // Asumsikan editingPatient.JadwalOperasi adalah string "YYYY-MM-DD"
      // Kita tambahkan waktu default agar bisa ditampilkan di input datetime-local
      if (editingPatient.JadwalOperasi) {
        try {
          // Cek jika sudah ada 'T'
          if (editingPatient.JadwalOperasi.includes('T')) {
             setJadwalOperasi(editingPatient.JadwalOperasi.slice(0, 16));
          } else {
            // Tambahkan waktu default (misal: 09:00) jika hanya tanggal
            setJadwalOperasi(`${editingPatient.JadwalOperasi}T09:00`);
          }
        } catch (e) {
          console.warn("Invalid date format for JadwalOperasi", editingPatient.JadwalOperasi);
          setJadwalOperasi('');
        }
      } else {
        setJadwalOperasi('');
      }
      // --- AKHIR PERBAIKAN TANGGAL ---

      setDokter(editingPatient.Dokter || '');
      setGender(editingPatient.Gender || '');
      setUmur(editingPatient.Umur || '');
      setDiagnosa(editingPatient.Diagnosa || '');
      setPayer(editingPatient.Payer || '');
      setKelas(editingPatient.Kelas || '');
      setSkala(editingPatient.Skala || '');

    } else {
      // Kosongkan form jika mode 'Tambah'
      resetForm();
    }
  }, [editingPatient, isEditMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const token = localStorage.getItem('admin_token');
    
    // --- PERBAIKAN 1: FORMAT DATA TANGGAL ---
    // Ekstrak HANYA bagian tanggal (YYYY-MM-DD) dari string datetime-local
    const formattedJadwalOperasi = JadwalOperasi ? JadwalOperasi.split('T')[0] : null;
    
    const patientData = {
      NomorMR,
      NamaPasien,
      JadwalOperasi: formattedJadwalOperasi, // Kirim tanggal yang sudah diformat
      Dokter: Dokter || null,
      Gender: Gender || null,
      Umur: Umur || null,
      Diagnosa: Diagnosa || null,
      Payer: Payer || null,
      Kelas: Kelas || null,
      Skala: Skala || null,
    };

    try {
      // --- PERBAIKAN 2:ENDPOINT & METHOD ---
      // Selalu gunakan 'create-patient-session' karena itu adalah fungsi UPSERT
      // Selalu gunakan 'post'
      const apiEndpoint = '/.netlify/functions/create-patient-session';
      const method = 'post';
      // --- AKHIR PERBAIKAN ---

      await axios[method](apiEndpoint, patientData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      onSuccess(); // Panggil fungsi onSuccess dari parent
    } catch (err) {
      console.error('Error submitting form:', err);
      // Menampilkan pesan error dari backend
      const errorMsg = err.response?.data?.details || err.response?.data?.error || 'Gagal menyimpan data. Coba lagi.';
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="add-patient-form" onSubmit={handleSubmit}>
      <h3>{isEditMode ? 'Edit Data Pasien' : 'Formulir Pasien Baru'}</h3>
      {error && <div className="form-error">{error}</div>}
      <div className="form-grid">
        {/* Baris 1: MR & Nama */}
        <div className="form-group">
          <label htmlFor="NomorMR">Nomor MR</label>
          <input
            id="NomorMR"
            type="text"
            value={NomorMR}
            onChange={(e) => setNomorMR(e.target.value)}
            required
            disabled={isEditMode} // Nomor MR tidak bisa diubah saat edit
          />
        </div>
        <div className="form-group">
          <label htmlFor="NamaPasien">Nama Pasien</label>
          <input
            id="NamaPasien"
            type="text"
            value={NamaPasien}
            onChange={(e) => setNamaPasien(e.target.value)}
            required
          />
        </div>
        
        {/* Baris 2: Jadwal Operasi (Full Width) */}
        <div className="form-group">
          <label htmlFor="JadwalOperasi">Jadwal Operasi (Tanggal & Waktu)</label>
          <input
            id="JadwalOperasi"
            type="datetime-local" // Menggunakan input tanggal & waktu
            value={JadwalOperasi}
            onChange={(e) => setJadwalOperasi(e.target.value)}
          />
        </div>
        
        {/* Baris 3: Dokter (Full Width) */}
        <div className="form-group">
          <label htmlFor="Dokter">Dokter</label>
          <input
            id="Dokter"
            type="text"
            value={Dokter}
            onChange={(e) => setDokter(e.target.value)}
            placeholder="Contoh: Dr. John Doe"
          />
        </div>

        {/* Baris 4: Gender & Umur */}
        <div className="form-group">
          <label htmlFor="Gender">Gender</label>
          <select id="Gender" value={Gender} onChange={(e) => setGender(e.target.value)}>
            <option value="">-- Pilih Gender --</option>
            <option value="Pria">Pria</option>
            <option value="Wanita">Wanita</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="Umur">Umur</label>
          <input
            id="Umur"
            type="number"
            value={Umur}
            onChange={(e) => setUmur(e.target.value)}
            placeholder="Contoh: 45"
          />
        </div>

        {/* Baris 5: Diagnosa (Full Width) */}
        <div className="form-group">
          <label htmlFor="Diagnosa">Diagnosa</label>
          <input
            id="Diagnosa"
            type="text"
            value={Diagnosa}
            onChange={(e) => setDiagnosa(e.target.value)}
            placeholder="Contoh: Hernia Inguinalis"
          />
        </div>

        {/* Baris 6: Payer & Kelas */}
        <div className="form-group">
          <label htmlFor="Payer">Payer</label>
          <input
            id="Payer"
            type="text"
            value={Payer}
            onChange={(e) => setPayer(e.target.value)}
            placeholder="Contoh: BPJS / Pribadi"
          />
        </div>
        <div className="form-group">
          <label htmlFor="Kelas">Kelas</label>
          <input
            id="Kelas"
            type="text"
            value={Kelas}
            onChange={(e) => setKelas(e.target.value)}
            placeholder="Contoh: VIP / Kelas 1"
          />
        </div>

        {/* Baris 7: Skala */}
        <div className="form-group">
          <label htmlFor="Skala">Skala</label>
          <input
            id="Skala"
            type="text"
            value={Skala}
            onChange={(e) => setSkala(e.target.value)}
            placeholder="Data Skala (jika ada)"
          />
        </div>

      </div>
      
      <div className="form-actions">
        <button type="button" onClick={onCancel} className="btn-cancel" disabled={isSubmitting}>
          Batal
        </button>
        <button type="submit" className="btn-submit" disabled={isSubmitting}>
          {isSubmitting ? (isEditMode ? 'Menyimpan...' : 'Menambahkan...') : (isEditMode ? 'Simpan Perubahan' : 'Tambah Pasien')}
        </button>
      </div>
    </form>
  );
};

export default AddPatientForm;