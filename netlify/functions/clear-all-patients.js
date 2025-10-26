// netlify/functions/clear-all-patients.js
const { db } = require('../utils/database');
const { verifyAdminToken } = require('../utils/auth');
const { checkPermission } = require('../utils/permissions');

exports.handler = async function(event, context) {
  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  // Hanya izinkan metode POST (lebih aman untuk aksi destruktif dengan body)
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Unauthorized' })
    };
  }

  try {
    const decoded = verifyAdminToken(authHeader);
    if (!decoded) {
      return {
        statusCode: 401,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    // PENGAMAN 1: Hanya user dengan izin 'manage_users' (Admin) yang bisa
    if (!checkPermission(decoded, 'manage_users')) {
      return {
        statusCode: 403,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Hanya admin yang dapat melakukan aksi ini' })
      };
    }

    const { confirmation } = JSON.parse(event.body);

    // PENGAMAN 2: Memerlukan string konfirmasi yang sama persis
    if (confirmation !== "HAPUS PERMANEN") {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'String konfirmasi salah' })
      };
    }

    // AKSI BERBAHAYA: Menghapus semua data dari tabel patients
    // TRUNCATE lebih cepat daripada DELETE dan akan me-reset auto-increment (jika ada)
    // Kita hanya mentruncate 'patients'. Men-truncate 'users' akan mengunci semua orang.
    
    console.warn(`⚠️ AKSI DESTRUKTIF: User ${decoded.username} akan MENGHAPUS SEMUA DATA PASIEN!`);
    
    await db.query('TRUNCATE TABLE patients');

    console.log(`✅ AKSI BERHASIL: Tabel 'patients' telah dikosongkan oleh ${decoded.username}.`);

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        message: 'Semua data pasien telah berhasil dihapus secara permanen.'
      })
    };

  } catch (error) {
    console.error('Error clearing patients table:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        error: 'Gagal mengosongkan tabel',
        details: error.message 
      })
    };
  }
};