const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

exports.handler = async function (event, context) {
  let client;
  try {
    client = await pool.connect();
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS patients (
        "NomorMR" VARCHAR(255) PRIMARY KEY,
        "NamaPasien" VARCHAR(255) NOT NULL,
        "JadwalOperasi" DATE,
        "Dokter" VARCHAR(255),
        "StatusPersetujuan" VARCHAR(50) DEFAULT 'Menunggu',
        "TimestampPersetujuan" TIMESTAMPTZ,
        "LinkBuktiPDF" TEXT,
        "TimestampDibuat" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        "TokenAkses" VARCHAR(255) UNIQUE
      );
    `;
    
    await client.query(createTableQuery);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Table created successfully or already exists'
      }),
    };
  } catch (error) {
    console.error('Error creating table:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to create table',
        details: error.message
      }),
    };
  } finally {
    if (client) {
      client.release();
      console.log('Client released');
    }
  }
};