// netlify/functions/get-all-users.js
const { verifyAdminToken } = require('../utils/auth');
const { checkPermission } = require('../utils/permissions');
const { db } = require('../utils/database');

exports.handler = async function(event, context) {
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

    // Hanya admin yang bisa melihat daftar user
    if (!checkPermission(decoded, 'all_access')) {
      return {
        statusCode: 403,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Hanya admin yang dapat mengakses daftar user' })
      };
    }

    // Ambil semua data user (tanpa password_hash untuk keamanan)
    const result = await db.query(`
      SELECT 
        id, 
        username, 
        role, 
        permissions, 
        is_active, 
        created_at
      FROM users 
      ORDER BY 
        CASE 
          WHEN role = 'admin' THEN 1
          WHEN role = 'admin_poc' THEN 2  
          WHEN role = 'exporter' THEN 3
          ELSE 4
        END,
        username ASC
    `);

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(result.rows)
    };

  } catch (error) {
    console.error('Error fetching users:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        error: 'Gagal mengambil data user',
        details: error.message 
      })
    };
  }
};