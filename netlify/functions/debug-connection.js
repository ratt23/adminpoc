const { Pool } = require('pg');

exports.handler = async function (event, context) {
  console.log('=== Debug Connection ===');
  
  // Check if DATABASE_URL exists
  const hasDbUrl = !!process.env.DATABASE_URL;
  console.log('DATABASE_URL exists:', hasDbUrl);
  
  if (hasDbUrl) {
    const dbUrl = process.env.DATABASE_URL;
    
    // Safe logging (don't expose credentials)
    const urlParts = dbUrl.split('@');
    if (urlParts.length > 1) {
      const hostPart = urlParts[1].split('/')[0];
      console.log('Database host:', hostPart);
    } else {
      console.log('Invalid DATABASE_URL format');
    }
    
    console.log('DATABASE_URL length:', dbUrl.length);
    console.log('DATABASE_URL starts with:', dbUrl.substring(0, 20) + '...');
  }

  if (!process.env.DATABASE_URL) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'DATABASE_URL is not set',
        message: 'Please set the DATABASE_URL environment variable in Netlify'
      }),
    };
  }

  // Test different connection configurations
  const configs = [
    {
      name: 'Basic SSL',
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    },
    {
      name: 'Without SSL',
      connectionString: process.env.DATABASE_URL,
      ssl: false
    },
    {
      name: 'With require SSL',
      connectionString: process.env.DATABASE_URL + '?sslmode=require',
      ssl: { rejectUnauthorized: false }
    }
  ];

  for (const config of configs) {
    console.log(`Testing config: ${config.name}`);
    
    const pool = new Pool(config);
    
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT version()');
      client.release();
      await pool.end();
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          config: config.name,
          message: 'Database connection successful!',
          version: result.rows[0].version
        }),
      };
    } catch (error) {
      console.error(`Config ${config.name} failed:`, error.message);
      await pool.end();
      // Continue to next config
    }
  }

  return {
    statusCode: 500,
    body: JSON.stringify({
      error: 'All connection attempts failed',
      message: 'Please check your DATABASE_URL and SSL settings'
    }),
  };
};