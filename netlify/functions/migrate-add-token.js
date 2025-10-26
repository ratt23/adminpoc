const { Pool } = require('pg');

let pool;
try {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is not set.');
  }
  const cleanDbUrl = dbUrl.split('?')[0]; 
  const poolConfig = {
    connectionString: cleanDbUrl,
    ssl: { rejectUnauthorized: false }
  };
  pool = new Pool(poolConfig);
} catch (error) {
  console.error("Error during pool initialization:", error);
}

exports.handler = async function (event, context) {
  console.log('=== migrate-add-token (FIXED) called ===');
  
  if (!pool) {
    return { 
      statusCode: 500, 
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Database pool not available' }) 
    };
  }

  let client;
  try {
    client = await pool.connect();
    console.log('Database connected, checking for TokenAkses column...');
    
    // Cek apakah kolom TokenAkses sudah ada
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'patients' AND column_name = 'TokenAkses'
    `;
    
    const checkResult = await client.query(checkQuery);
    
    if (checkResult.rows.length === 0) {
      // --- JALUR 1: KOLOM BELUM ADA ---
      // Tambahkan kolom baru dengan tipe yang benar
      console.log('Adding TokenAkses column to patients table...');
      await client.query(`
        ALTER TABLE patients 
        ADD COLUMN "TokenAkses" VARCHAR(255) UNIQUE
      `);
      console.log('TokenAkses column ADDED successfully');
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          success: true, 
          message: 'BERHASIL: Kolom TokenAkses telah DITAMBAHKAN.' 
        }),
      };
    } else {
      // --- JALUR 2 (PERBAIKAN): KOLOM SUDAH ADA ---
      // Perbaiki tipe kolom yang sudah ada menjadi VARCHAR(255)
      console.log('TokenAkses column already exists. Altering type...');
      await client.query(`
        ALTER TABLE patients 
        ALTER COLUMN "TokenAkses" TYPE VARCHAR(255)
      `);
      console.log('TokenAkses column type ALTERED successfully');

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          success: true, 
          message: 'BERHASIL: Tipe kolom TokenAkses telah DIPERBAIKI menjadi VARCHAR(255).' 
        }),
      };
    }
  } catch (error) {
    console.error('Error during migration:', error);
    return { 
      statusCode: 500, 
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        error: 'Migration failed', 
        details: error.message 
      }) 
    };
  } finally {
    if (client) { 
      client.release(); 
      console.log('Client released'); 
    }
  }
};