// netlify/functions/create-user.js
const { db } = require('../utils/database');
const bcrypt = require('bcryptjs');
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

    // Hanya admin yang bisa membuat user
    if (!checkPermission(decoded, 'manage_users')) {
      return {
        statusCode: 403,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Hanya admin yang dapat membuat user' })
      };
    }

    const { username, password, role } = JSON.parse(event.body);

    if (!username || !password || !role) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Username, password, dan role harus diisi' })
      };
    }

    if (password.length < 6) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Password minimal 6 karakter' })
      };
    }

    // Validasi role
    const validRoles = ['admin', 'admin_poc', 'exporter'];
    if (!validRoles.includes(role)) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Role tidak valid. Pilih: admin, admin_poc, atau exporter' })
      };
    }

    // Cek apakah username sudah ada
    const existingUser = await db.query('SELECT username FROM users WHERE username = $1', [username]);
    if (existingUser.rows.length > 0) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Username sudah digunakan' })
      };
    }

    // Dapatkan permissions berdasarkan role
    const permissions = getPermissionsByRole(role);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user baru
    const result = await db.query(
      `INSERT INTO users (username, password_hash, role, permissions, is_active) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, username, role, permissions, is_active, created_at`,
      [username, hashedPassword, role, permissions, true]
    );

    console.log(`✅ User baru berhasil dibuat: ${username} dengan role: ${role}`);
    console.log(`📋 Permissions:`, permissions);

    return {
      statusCode: 201,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        message: `User ${username} berhasil dibuat`,
        user: result.rows[0]
      })
    };

  } catch (error) {
    console.error('Error creating user:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        error: 'Gagal membuat user',
        details: error.message 
      })
    };
  }
};