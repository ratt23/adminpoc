const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

exports.handler = async function (event, context) {
  console.log('=== migrate-add-petugas called ===');
  
  let client;
  try {
    client = await pool.connect();
    console.log('Database connected, adding petugas columns...');
    
    const alterQueries = [
      `ALTER TABLE patients ADD COLUMN IF NOT EXISTS "NamaPetugas" VARCHAR(255)`,
      `ALTER TABLE patients ADD COLUMN IF NOT EXISTS "PetugasParafData" JSONB`
    ];

    const results = [];
    for (const query of alterQueries) {
      try {
        const result = await client.query(query);
        results.push({ query, status: 'success' });
        console.log('Executed:', query);
      } catch (error) {
        results.push({ query, status: 'error', error: error.message });
        console.error('Error executing:', query, error.message);
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        success: true, 
        message: 'Migration for Petugas columns completed',
        results: results
      }),
    };
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