// netlify/functions/toggle-user-status.js
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

    // Hanya admin yang bisa mengganti status user
    if (!checkPermission(decoded, 'all_access')) {
      return {
        statusCode: 403,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Hanya admin yang dapat mengganti status user' })
      };
    }

    const { username, is_active } = JSON.parse(event.body);

    if (!username || typeof is_active !== 'boolean') {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Username dan status harus diisi' })
      };
    }

    // Update status user
    const result = await db.query(
      'UPDATE users SET is_active = $1 WHERE username = $2 RETURNING username, is_active',
      [is_active, username]
    );

    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'User tidak ditemukan' })
      };
    }

    const action = is_active ? 'diaktifkan' : 'dinonaktifkan';
    console.log(`✅ User ${username} berhasil ${action}`);

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        message: `User ${username} berhasil ${action}`,
        user: result.rows[0]
      })
    };

  } catch (error) {
    console.error('Error toggling user status:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        error: 'Gagal mengubah status user',
        details: error.message 
      })
    };
  }
};