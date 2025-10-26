// netlify/functions/create-patient-session.js
const { verifyAdminToken } = require('../utils/auth');
const { checkPermission } = require('../utils/permissions');
const { createPatientToken } = require('../utils/auth');

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

    // Check permission untuk add_patient
    if (!checkPermission(decoded, 'add_patient')) {
      return {
        statusCode: 403,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Insufficient permissions' })
      };
    }

    const { NomorMR, NamaPasien, JadwalOperasi, Dokter, Gender, Umur, Diagnosa, Payer, Kelas, Skala } = JSON.parse(event.body);
    
    if (!NomorMR || !NamaPasien) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Nomor MR and Nama Pasien are required' })
      };
    }

    const { db } = require('../utils/database');
    
    // Generate token akses unik menggunakan createPatientToken
    const tokenAkses = createPatientToken();
    
    // Cek apakah pasien sudah ada
    const existingPatient = await db.query('SELECT * FROM patients WHERE "NomorMR" = $1', [NomorMR]);
    
    if (existingPatient.rows.length > 0) {
      // Update pasien yang sudah ada
      const result = await db.query(
        `UPDATE patients 
         SET "NamaPasien" = $1, "JadwalOperasi" = $2, "Dokter" = $3, "Gender" = $4, "Umur" = $5, 
             "Diagnosa" = $6, "Payer" = $7, "Kelas" = $8, "Skala" = $9, "TokenAkses" = $10
         WHERE "NomorMR" = $11 
         RETURNING *`,
        [NamaPasien, JadwalOperasi, Dokter, Gender, Umur, Diagnosa, Payer, Kelas, Skala, tokenAkses, NomorMR]
      );
      
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          message: 'Patient updated successfully',
          patient: result.rows[0] 
        })
      };
    } else {
      // Insert pasien baru
      const result = await db.query(
        `INSERT INTO patients 
         ("NomorMR", "NamaPasien", "JadwalOperasi", "Dokter", "Gender", "Umur", "Diagnosa", "Payer", "Kelas", "Skala", "TokenAkses") 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
         RETURNING *`,
        [NomorMR, NamaPasien, JadwalOperasi, Dokter, Gender, Umur, Diagnosa, Payer, Kelas, Skala, tokenAkses]
      );
      
      return {
        statusCode: 201,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          message: 'Patient created successfully',
          patient: result.rows[0] 
        })
      };
    }
  } catch (error) {
    console.error('Error creating/updating patient:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};