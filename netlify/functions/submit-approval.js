// netlify/functions/submit-approval.js
const { Pool } = require('pg');

// 1. Definisikan Pool secara global agar koneksi bisa dipakai ulang
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  
  // Tambahkan headers ke semua respons error
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  let client; // Deklarasikan client di luar try

  try {
    const body = JSON.parse(event.body);
    console.log('Received data:', body);

    const {
      NomorMR,
      token,
      signature_data,
      persetujuanData,
      namaPetugas,
      petugasParafData,
      catatanDokter
    } = body;

    // Validasi field wajib
    if (!NomorMR || !token || !signature_data) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // 2. Gunakan pool.connect() untuk mendapatkan client
    client = await pool.connect();

    // 3. PERBAIKAN: Tambahkan tanda kutip (") di semua nama kolom
    //    dan ganti 'token' menjadi 'TokenAkses'
    const query = `
      UPDATE patients 
      SET 
        "StatusPersetujuan" = 'Disetujui',
        "SignatureData" = $1,
        "PersetujuanData" = $2,
        "NamaPetugas" = $3,
        "PetugasParafData" = $4,
        "CatatanDokter" = $5,
        "TimestampPersetujuan" = CURRENT_TIMESTAMP
      WHERE "NomorMR" = $6 AND "TokenAkses" = $7
      RETURNING *
    `;

    const values = [
      signature_data,
      JSON.stringify(persetujuanData || {}),
      namaPetugas || null, // Ganti string kosong '' menjadi null
      JSON.stringify(petugasParafData || {}),
      catatanDokter || null, // Ganti string kosong '' menjadi null
      NomorMR,
      token
    ];

    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Patient not found or token invalid' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Approval submitted successfully',
        patient: result.rows[0]
      })
    };

  } catch (error) {
    console.error('Database error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      })
    };
  } finally {
    // 4. Selalu release client di finally
    if (client) {
      client.release();
      console.log('Client released for submit-approval');
    }
  }
};