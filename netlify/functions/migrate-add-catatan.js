const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

exports.handler = async function (event, context) {
  console.log('=== migrate-add-catatan called ===');
  
  let client;
  try {
    client = await pool.connect();
    console.log('Database connected, adding CatatanDokter column...');
    
    const query = `ALTER TABLE patients ADD COLUMN IF NOT EXISTS "CatatanDokter" TEXT`;
    
    await client.query(query);
    console.log('Executed:', query);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        success: true, 
        message: 'Migration for CatatanDokter column completed successfully or column already exists.'
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