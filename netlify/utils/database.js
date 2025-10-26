const { Pool } = require('pg');

console.log('Initializing database connection...');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);

// Konfigurasi connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Test connection on startup
pool.on('connect', () => {
  console.log('Database connected successfully');
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Database utility object dengan error handling
const db = {
  query: async (text, params) => {
    const start = Date.now();
    try {
      const result = await pool.query(text, params);
      const duration = Date.now() - start;
      console.log('Executed query', { text, duration, rows: result.rowCount });
      return result;
    } catch (error) {
      console.error('Error executing query', { text, params, error: error.message });
      throw error;
    }
  },
};

// Test connection
const testConnection = async () => {
  try {
    const result = await db.query('SELECT NOW()');
    console.log('Database connection test successful:', result.rows[0].now);
  } catch (error) {
    console.error('Database connection test failed:', error.message);
  }
};

testConnection();

module.exports = { db, pool };