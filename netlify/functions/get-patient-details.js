const { db } = require('../utils/database');
const { verifyAdminToken } = require('../utils/auth');
const { checkPermission } = require('../utils/permissions');

exports.handler = async function (event, context) {
  console.log('=== get-patient-details called ===');
  
  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const { NomorMR } = event.queryStringParameters;

  if (!NomorMR) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'NomorMR is required' }),
    };
  }

  console.log('Fetching details for NomorMR:', NomorMR);

  try {
    // Check authorization for admin access
    const authHeader = event.headers.authorization;
    let hasAccess = false;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const decoded = verifyAdminToken(authHeader);
      if (decoded && checkPermission(decoded, 'view_patients')) {
        hasAccess = true;
        console.log('Access granted for admin:', decoded.username);
      }
    }

    if (!hasAccess) {
      return {
        statusCode: 401,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    const result = await db.query(
      `SELECT "NomorMR", "NamaPasien", "JadwalOperasi", "StatusPersetujuan", 
              "TimestampPersetujuan", "LinkBuktiPDF", "TimestampDibuat", "TokenAkses",
              "Gender", "Umur", "Diagnosa", "Payer", "Kelas", "Skala", "Dokter"
       FROM patients 
       WHERE "NomorMR" = $1`,
      [NomorMR]
    );
    
    if (result.rows.length === 0) {
      console.log('Patient not found:', NomorMR);
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Pasien tidak ditemukan' }),
      };
    }

    console.log('Patient found:', result.rows[0].NamaPasien);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(result.rows[0]),
    };
  } catch (error) {
    console.error('Error fetching patient details:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        error: 'Gagal mengambil data pasien',
        details: error.message 
      }),
    };
  }
};