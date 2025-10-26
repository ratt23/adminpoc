// netlify/functions/delete-user.js
const { db } = require('../utils/database');
const { verifyAdminToken } = require('../utils/auth');
const { checkPermission } = require('../utils/permissions');

exports.handler = async function(event, context) {
  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'DELETE, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'DELETE') {
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

    // Hanya admin yang bisa menghapus user
    if (!checkPermission(decoded, 'manage_users')) {
      return {
        statusCode: 403,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Hanya admin yang dapat menghapus user' })
      };
    }

    const { username } = JSON.parse(event.body);

    if (!username) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Username harus diisi' })
      };
    }

    // Pengaman Kritis 1: Mencegah user menghapus akunnya sendiri
    if (decoded.username === username) {
      return {
        statusCode: 403,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Anda tidak dapat menghapus akun Anda sendiri' })
      };
    }

    // Pengaman Kritis 2: Mencegah penghapusan admin terakhir
    // Cek dulu apakah user yang akan dihapus adalah admin
    const userToDelete = await db.query("SELECT role, permissions FROM users WHERE username = $1", [username]);
    if (userToDelete.rows.length === 0) {
        return { statusCode: 404, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'User tidak ditemukan' }) };
    }
    
    const isDeletingAdmin = (userToDelete.rows[0].role === 'admin' || (userToDelete.rows[0].permissions && userToDelete.rows[0].permissions.all_access));

    if (isDeletingAdmin) {
        // Hitung jumlah total admin
        const adminCountResult = await db.query("SELECT COUNT(*) FROM users WHERE role = 'admin' OR permissions->>'all_access' = 'true'");
        const adminCount = parseInt(adminCountResult.rows[0].count, 10);
        
        if (adminCount <= 1) {
            return {
                statusCode: 403,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Tidak dapat menghapus admin terakhir di sistem' })
            };
        }
    }

    // Lanjutkan proses hapus
    const result = await db.query(
      'DELETE FROM users WHERE username = $1 RETURNING username',
      [username]
    );

    if (result.rows.length === 0) {
      // Ini seharusnya sudah ditangani di atas, tapi sebagai fallback
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'User tidak ditemukan' })
      };
    }

    console.log(`✅ User ${username} berhasil dihapus oleh ${decoded.username}`);

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        message: `User ${username} berhasil dihapus`
      })
    };

  } catch (error) {
    console.error('Error deleting user:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        error: 'Gagal menghapus user',
        details: error.message 
      })
    };
  }
};