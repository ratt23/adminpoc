const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

exports.handler = async function (event, context) {
  console.log('=== migrate-add-new-columns called ===');
  
  let client;
  try {
    client = await pool.connect();
    console.log('Database connected, checking for new columns...');
    
    // Daftar kolom yang ingin ditambahkan (Tetap gunakan IF NOT EXISTS)
    const addQueries = [
      `ALTER TABLE patients ADD COLUMN IF NOT EXISTS "Gender" VARCHAR(50)`,
      `ALTER TABLE patients ADD COLUMN IF NOT EXISTS "Umur" VARCHAR(20)`,
      `ALTER TABLE patients ADD COLUMN IF NOT EXISTS "Diagnosa" TEXT`,
      `ALTER TABLE patients ADD COLUMN IF NOT EXISTS "Payer" VARCHAR(100)`,
      `ALTER TABLE patients ADD COLUMN IF NOT EXISTS "Kelas" VARCHAR(50)`,
      `ALTER TABLE patients ADD COLUMN IF NOT EXISTS "Skala" VARCHAR(50)`,
      `ALTER TABLE patients ADD COLUMN IF NOT EXISTS "Dokter" VARCHAR(255)`,
      `ALTER TABLE patients ADD COLUMN IF NOT EXISTS "PersetujuanData" JSONB`,
      `ALTER TABLE patients ADD COLUMN IF NOT EXISTS "SignatureData" TEXT`,
      `ALTER TABLE patients ADD COLUMN IF NOT EXISTS "TimestampDibuat" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP`
    ];

    // --- PERUBAHAN DIMULAI DI SINI ---
    // Daftar perintah untuk MEMPERBAIKI tipe data kolom yang mungkin sudah ada
    const alterQueries = [
      `ALTER TABLE patients ALTER COLUMN "Gender" TYPE VARCHAR(50)`,
      `ALTER TABLE patients ALTER COLUMN "Umur" TYPE VARCHAR(20)`,
      `ALTER TABLE patients ALTER COLUMN "Diagnosa" TYPE TEXT`,
      `ALTER TABLE patients ALTER COLUMN "Payer" TYPE VARCHAR(100)`,
      `ALTER TABLE patients ALTER COLUMN "Kelas" TYPE VARCHAR(50)`,
      `ALTER TABLE patients ALTER COLUMN "Skala" TYPE VARCHAR(50)`,
      `ALTER TABLE patients ALTER COLUMN "Dokter" TYPE VARCHAR(255)`
    ];
    // --- AKHIR PERUBAHAN ---

    const results = [];
    
    // 1. Jalankan kueri ADD IF NOT EXISTS (Aman untuk dijalankan berulang)
    console.log('--- Running ADD COLUMN queries ---');
    for (const query of addQueries) {
      try {
        await client.query(query);
        results.push({ query, status: 'add_success_or_skipped' });
      } catch (error) {
        results.push({ query, status: 'add_error', error: error.message });
      }
    }

    // 2. Jalankan kueri ALTER COLUMN (Memperbaiki tipe data)
    console.log('--- Running ALTER COLUMN queries ---');
    for (const query of alterQueries) {
      try {
        // Ini akan gagal jika kolom tidak ada, tapi tidak masalah
        // karena kueri di atas sudah memastikannya ada.
        await client.query(query);
        results.push({ query, status: 'alter_success' });
      } catch (error) {
        // Kita bisa abaikan error "column ... does not exist" jika terjadi
        if (!error.message.includes('does not exist')) {
          results.push({ query, status: 'alter_error', error: error.message });
        } else {
          results.push({ query, status: 'alter_skipped_not_exist' });
        }
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        success: true, 
        message: 'Migration completed. Column types have been verified.',
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