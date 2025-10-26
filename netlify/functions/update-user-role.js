// netlify/functions/update-user-role.js
const { db } = require('../utils/database');
const { verifyAdminToken } = require('../utils/auth');
const { checkPermission, getPermissionsByRole } = require('../utils/permissions');

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

    // Hanya admin yang bisa mengubah role
    if (!checkPermission(decoded, 'manage_users')) {
      return {
        statusCode: 403,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Hanya admin yang dapat mengubah role user' })
      };
    }

    const { username, newRole } = JSON.parse(event.body);

    // Validasi
    if (!username || !newRole) {
      return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Username dan role baru harus diisi' }) };
    }
    const validRoles = ['admin', 'admin_poc', 'exporter'];
    if (!validRoles.includes(newRole)) {
      return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Role tidak valid' }) };
    }

    // Pengaman Kritis 1: Mencegah user mengubah role-nya sendiri
    if (decoded.username === username) {
      return {
        statusCode: 403,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Anda tidak dapat mengubah role Anda sendiri' })
      };
    }

    // Pengaman Kritis 2: Mencegah demosi admin terakhir
    const userToEdit = await db.query("SELECT role, permissions FROM users WHERE username = $1", [username]);
    if (userToEdit.rows.length === 0) {
        return { statusCode: 404, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'User tidak ditemukan' }) };
    }
    
    const isLastAdmin = (userToEdit.rows[0].role === 'admin' || (userToEdit.rows[0].permissions && userToEdit.rows[0].permissions.all_access));

    if (isLastAdmin && newRole !== 'admin') {
        const adminCountResult = await db.query("SELECT COUNT(*) FROM users WHERE role = 'admin' OR permissions->>'all_access' = 'true'");
        const adminCount = parseInt(adminCountResult.rows[0].count, 10);
        
        if (adminCount <= 1) {
            return {
                statusCode: 403,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Tidak dapat mengubah role admin terakhir' })
            };
        }
    }

    // Dapatkan permissions baru berdasarkan role baru
    const newPermissions = getPermissionsByRole(newRole);
    const permissionsJson = JSON.stringify(newPermissions);

    // Update user di database
    const result = await db.query(
      'UPDATE users SET role = $1, permissions = $2 WHERE username = $3 RETURNING username, role, permissions, is_active',
      [newRole, permissionsJson, username]
    );

    console.log(`✅ Role untuk ${username} berhasil diubah menjadi ${newRole} oleh ${decoded.username}`);

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        message: `Role user ${username} berhasil diubah`,
        user: result.rows[0]
      })
    };

  } catch (error) {
    console.error('Error updating user role:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        error: 'Gagal mengubah role user',
        details: error.message 
      })
    };
  }
};