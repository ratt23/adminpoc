// PatientTable.js
// VERSI UPGRADE (Menerima props paginasi dan menghitung nomor urut)

import React, { useState } from 'react';
import './PatientTable.css';

// Fungsi helper sapaan
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'Selamat pagi';
  if (hour >= 11 && hour < 15) return 'Selamat siang';
  if (hour >= 15 && hour < 18) return 'Selamat sore';
  return 'Selamat malam';
};

// Fungsi fallback untuk salin link
const fallbackCopyTextToClipboard = (text) => {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.top = '0';
  textArea.style.left = '0';
  textArea.style.opacity = '0';
  
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    const successful = document.execCommand('copy');
    return successful;
  } catch (err) {
    console.error('Fallback copy failed:', err);
    throw err;
  } finally {
    document.body.removeChild(textArea);
  }
};

// --- PERUBAHAN 1: Menambahkan props currentPage dan patientsPerPage ---
const PatientTable = ({ 
  patients, 
  onEdit, 
  onDelete, 
  userPermissions, 
  currentPage, 
  patientsPerPage 
}) => {
  const [copiedLink, setCopiedLink] = useState(null);
  const [showManualCopyModal, setShowManualCopyModal] = useState(false);
  const [messageToCopy, setMessageToCopy] = useState('');
  
  const PATIENT_APP_URL = process.env.REACT_APP_PATIENT_URL || 'https://ebookletv1.netlify.app/pasien/';

  // Check permission helper
  const can = (permission) => {
    if (!userPermissions) return false;
    if (userPermissions.all_access) return true;
    return userPermissions[permission] === true;
  };

  // Fungsi salin link
  const handleCopyLink = async (token, nomorMR) => {
    if (!token) {
      alert(`Gagal menyalin link: Pasien ${nomorMR} belum memiliki token unik.`);
      return;
    }
    const cleanToken = token.toString().trim();
    const linkToCopy = `${PATIENT_APP_URL}${cleanToken}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(linkToCopy);
      } else {
        fallbackCopyTextToClipboard(linkToCopy);
      }
      setCopiedLink(cleanToken);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (error) {
      console.error('Gagal menyalin link:', error);
      alert('Gagal menyalin link. Silakan coba lagi.');
    }
  };

  // Fungsi untuk menangani salin pesan manual
  const handleManualCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(messageToCopy);
      } else {
        fallbackCopyTextToClipboard(messageToCopy);
      }
      alert('Pesan telah disalin! Silakan tempel di WhatsApp.');
      setShowManualCopyModal(false);
    } catch (error) {
      alert('Gagal menyalin pesan. Silakan coba lagi.');
    }
  };

  // Fungsi kirim WhatsApp
  const handleSendWhatsApp = (token, namaPasien, nomorMR) => {
    if (!token) {
      alert(`Gagal mengirim WA: Pasien ${nomorMR} belum memiliki token unik.`);
      return;
    }
    const cleanToken = token.toString().trim();
    const greeting = getGreeting();
    const patientLink = `${PATIENT_APP_URL}${cleanToken}`;
    const message = `${greeting}, ${namaPasien}.\n\nBerikut link booklet persiapan operasi Anda:\n${patientLink}\n\nTerima kasih.`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://api.whatsapp.com/send?text=${encodedMessage}`;
    const newTab = window.open(whatsappURL, '_blank', 'noopener,noreferrer');
    if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
      setMessageToCopy(message);
      setShowManualCopyModal(true);
    }
  };

  // Fungsi format tanggal
  const formatDate = (isoString) => {
    if (!isoString) return { date: 'Belum diatur', time: '' };
    try {
      const dateObj = new Date(isoString);
      const date = dateObj.toLocaleDateString('id-ID', {
        day: '2-digit', 
        month: 'short', 
        year: 'numeric', 
        timeZone: 'Asia/Jayapura' // Sesuaikan dengan zona waktu Anda
      });
      const time = dateObj.toLocaleTimeString('id-ID', {
        hour: '2-digit', 
        minute: '2-digit', 
        timeZone: 'Asia/Jayapura', // Sesuaikan dengan zona waktu Anda
        timeZoneName: 'short'
      });
      return { date, time };
    } catch (e) {
      return { date: 'Format salah', time: '' };
    }
  };

  return (
    <>
      <div className="patient-table-container">
        <table className="patient-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Nomor MR</th>
              <th>Nama Pasien</th>
              <th>Gender</th>
              <th>Umur</th>
              <th>Diagnosa</th>
              <th>Payer</th>
              <th>Kelas</th>
              <th>Skala</th>
              <th>Jadwal Operasi</th>
              <th>Dokter</th>
              <th>Status</th>
              <th>Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {patients.length === 0 ? (
              <tr>
                <td colSpan="13" className="no-data">
                  Tidak ada data pasien yang ditemukan.
                </td>
              </tr>
            ) : (
              patients.map((patient, index) => {
                const hasToken = !!patient.TokenAkses;
                const { date: opDate, time: opTime } = formatDate(patient.JadwalOperasi);
                
                // --- PERUBAHAN 2: Kalkulasi nomor urut ---
                const itemNumber = (currentPage - 1) * patientsPerPage + index + 1;
                // ----------------------------------------

                return (
                  <tr key={patient.NomorMR}>
                    <td data-label="No">{itemNumber}</td> {/* Menggunakan itemNumber */}
                    <td data-label="Nomor MR">{patient.NomorMR}</td>
                    <td data-label="Nama Pasien">{patient.NamaPasien}</td>
                    <td data-label="Gender">{patient.Gender || '-'}</td>
                    <td data-label="Umur">{patient.Umur || '-'}</td>
                    <td data-label="Diagnosa">{patient.Diagnosa || '-'}</td>
                    <td data-label="Payer">{patient.Payer || '-'}</td>
                    <td data-label="Kelas">{patient.Kelas || '-'}</td>
                    <td data-label="Skala">{patient.Skala || '-'}</td>
                    <td data-label="Jadwal Operasi">
                      <div>{opDate}</div>
                      {opTime && <div className="table-time">{opTime}</div>}
                    </td>
                    <td data-label="Dokter">{patient.Dokter || 'Akan ditentukan'}</td>
                    <td data-label="Status">
                      <span className={`status-badge ${
                        patient.StatusPersetujuan === 'Disetujui' ? 'status-approved' : 'status-waiting'
                      }`}>
                        {patient.StatusPersetujuan || 'Menunggu'}
                      </span>
                    </td>
                    <td data-label="Tindakan" className="table-actions">
                      {can('view_patients') && (
                        <button
                          onClick={() => handleCopyLink(patient.TokenAkses, patient.NomorMR)}
                          className={`btn-action btn-copy ${copiedLink === patient.TokenAkses ? 'btn-copied' : ''}`}
                          disabled={!hasToken}
                          title={!hasToken ? "Token belum dibuat" : "Salin Link Pasien"}
                        >
                          {copiedLink === patient.TokenAkses ? '✅ Tersalin!' : '🔗 Salin Link'}
                        </button>
                      )}
                      
                      {can('view_patients') && (
                        <button
                          onClick={() => handleSendWhatsApp(patient.TokenAkses, patient.NamaPasien, patient.NomorMR)}
                          className="btn-action btn-whatsapp"
                          disabled={!hasToken}
                          title={!hasToken ? "Token belum dibuat" : "Kirim via WhatsApp"}
                        >
                          📱 Kirim WA
                        </button>
                      )}

                      {can('edit_patient') && (
                        <button 
                          onClick={() => onEdit(patient)} 
                          className="btn-action btn-edit"
                          title="Edit Data Pasien"
                        >
                          ✏️ Edit
                        </button>
                      )}

                      {can('delete_patient') && (
                        <button 
                          onClick={() => onDelete(patient.NomorMR)} 
                          className="btn-action btn-delete"
                          title="Hapus Pasien"
                        >
                          🗑️ Hapus
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showManualCopyModal && (
        <div className="modal-overlay" onClick={() => setShowManualCopyModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Popup WhatsApp Diblokir</h3>
            <p>Silakan salin pesan berikut dan kirim manual melalui WhatsApp:</p>
            <div className="message-box">
              <pre>{messageToCopy}</pre>
            </div>
            <div className="modal-actions">
              <button onClick={handleManualCopy} className="btn-action btn-copy">
                📋 Salin Pesan
              </button>
              <button onClick={() => setShowManualCopyModal(false)} className="btn-action btn-delete">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PatientTable;