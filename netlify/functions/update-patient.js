const { db } = require('../utils/database');

exports.handler = async (event, context) => {
  console.log('=== update-patient called ===');
  
  if (event.httpMethod !== 'PUT') {
    return { 
      statusCode: 405, 
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  // Cek authorization
  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Unauthorized' }),
    };
  }

  try {
    const data = JSON.parse(event.body);
    
    const { 
      NomorMR,
      NamaPasien, 
      JadwalOperasi, 
      Dokter,
      Gender,
      Umur,
      Diagnosa,
      Payer,
      Kelas,
      Skala
    } = data;

    if (!NomorMR) {
      return { 
        statusCode: 400, 
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'NomorMR diperlukan untuk update.' }) 
      };
    }

    const queryText = `
      UPDATE patients 
      SET 
        "NamaPasien" = $1, 
        "JadwalOperasi" = $2, 
        "Dokter" = $3,
        "Gender" = $4,
        "Umur" = $5,
        "Diagnosa" = $6,
        "Payer" = $7,
        "Kelas" = $8,
        "Skala" = $9
      WHERE "NomorMR" = $10
    `;

    const values = [
      NamaPasien, 
      JadwalOperasi || null, 
      Dokter || null,
      Gender || null,
      Umur || null,
      Diagnosa || null,
      Payer || null,
      Kelas || null,
      Skala || null,
      NomorMR
    ];

    const result = await db.query(queryText, values);

    if (result.rowCount === 0) {
      return { 
        statusCode: 404, 
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Pasien tidak ditemukan.' }) 
      };
    }

    console.log(`Patient updated: ${NomorMR}`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Patient updated successfully' }),
    };

  } catch (error) {
    console.error('Error updating patient:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        error: 'Gagal memperbarui data pasien.',
        details: error.message 
      }),
    };
  }
};