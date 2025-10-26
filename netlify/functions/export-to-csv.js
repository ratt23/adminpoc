// netlify/functions/export-to-csv.js
// VERSI UPGRADE (Sortir berdasarkan data terbaru, bukan jadwal operasi)

const { Parser } = require('json2csv');
const { verifyAdminToken } = require('../utils/auth');
const { checkPermission } = require('../utils/permissions');
const { db } = require('../utils/database');

exports.handler = async function (event, context) {
  console.log('=== export-to-csv (UPGRADED) dipanggil ===');
  
  // Verifikasi token (harus ada)
  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Unauthorized' }),
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

    // Check permission untuk export_csv
    if (!checkPermission(decoded, 'export_csv')) {
      return {
        statusCode: 403,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Insufficient permissions' })
      };
    }

    console.log('Mengekspor data ke CSV...');
    
    // --- PERUBAHAN DI SINI ---
    // Mengubah urutan dari "JadwalOperasi" DESC menjadi "TimestampDibuat" DESC
    // agar sesuai dengan default sorting di dashboard.
    const result = await db.query(`
      SELECT * FROM patients 
      ORDER BY "TimestampDibuat" DESC
    `);
    // --- AKHIR PERUBAHAN ---
    
    console.log(`Mengekspor ${result.rows.length} data pasien.`);

    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Tidak ada data untuk diekspor' }),
      };
    }

    // Tambahkan nomor urut. Karena query SQL sudah diurutkan,
    // "No: 1" akan otomatis menjadi data yang terbaru dibuat.
    const dataWithNumber = result.rows.map((row, index) => {
      return {
        No: index + 1, // Nomor urut
        ...row
      };
    });

    // Field yang akan ditampilkan di CSV (dengan urutan yang diinginkan)
    const fields = [
      'No', // Nomor urut
      'NomorMR',
      'NamaPasien', 
      'Gender',
      'Umur',
      'Diagnosa', 
      'Payer',
      'Kelas',
      'Skala',
      'JadwalOperasi',
      'Dokter',
      'StatusPersetujuan',
      'TimestampPersetujuan',
      'TimestampDibuat', // Menambahkan timestamp kapan data dibuat
      'CatatanDokter', // Menambahkan catatan
      'NamaPetugas' // Menambahkan nama petugas
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(dataWithNumber);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="data-pasien.csv"',
        'Access-Control-Allow-Origin': '*', // Izinkan CORS untuk sukses
      },
      body: csv,
    };
  } catch (error) {
    console.error('Error mengekspor ke CSV:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        error: 'Gagal mengekspor data',
        details: error.message 
      }),
    };
  }
};