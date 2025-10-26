// netlify/functions/authorize.js
const { db } = require('../utils/database');
const bcrypt = require('bcryptjs');
const { createAdminToken } = require('../utils/auth');

// Hardcode credentials untuk emergency fallback
const HARDCODE_USERS = {
  'admin': {
    password: 'admin123',
    user: {
      id: 1,
      username: 'admin',
      role: 'admin',
      permissions: { all_access: true }
    }
  },
  'naomi.nanariarin': {
    password: 'admin123', 
    user: {
      id: 2,
      username: 'naomi.nanariarin',
      role: 'exporter',
      permissions: { export_csv: true, view_patients: true }
    }
  },
  'adminpoc': {
    password: 'admin123',
    user: {
      id: 3,
      username: 'adminpoc',
      role: 'admin_poc',
      permissions: { 
        view_patients: true, 
        add_patient: true, 
        edit_patient: true, 
        delete_patient: true, 
        export_csv: true 
      }
    }
  }
};

exports.handler = async function(event, context) {
  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
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

  try {
    let body;
    try {
      body = JSON.parse(event.body);
    } catch (parseError) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }

    const { username, password } = body;

    console.log('🔐 Login attempt for username:', username);

    if (!username || !password) {
      console.log('❌ Missing username or password');
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Username and password required' })
      };
    }

    // Clean inputs
    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Coba database first
    let user = null;
    let authMethod = 'database';
    
    try {
      console.log('📋 Querying database for user:', cleanUsername);
      const result = await db.query(
        'SELECT id, username, password_hash, role, permissions, is_active FROM users WHERE username = $1',
        [cleanUsername]
      );

      if (result.rows.length > 0) {
        const dbUser = result.rows[0];
        console.log('✅ User found in database:', dbUser.username);
        
        if (!dbUser.is_active) {
          console.log('❌ User account inactive:', cleanUsername);
          return {
            statusCode: 401,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Akun tidak aktif' })
          };
        }

        // Verify password dengan database hash
        const isValidPassword = await bcrypt.compare(cleanPassword, dbUser.password_hash);
        console.log('🔑 Database password validation result:', isValidPassword);

        if (isValidPassword) {
          user = {
            id: dbUser.id,
            username: dbUser.username,
            role: dbUser.role,
            permissions: dbUser.permissions
          };
        }
      }
    } catch (dbError) {
      console.error('💥 Database error, falling back to hardcode:', dbError.message);
      // Continue to hardcode fallback
    }

    // Fallback ke hardcode jika database gagal atau user tidak ditemukan
    if (!user && HARDCODE_USERS[cleanUsername]) {
      console.log('🔄 Falling back to hardcode for user:', cleanUsername);
      const hardcodeUser = HARDCODE_USERS[cleanUsername];
      
      if (cleanPassword === hardcodeUser.password) {
        user = hardcodeUser.user;
        authMethod = 'hardcode';
        console.log('✅ Hardcode authentication successful');
      }
    }

    // Jika kedua metode gagal
    if (!user) {
      console.log('❌ Authentication failed for user:', cleanUsername);
      return {
        statusCode: 401,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Username atau password salah!' })
      };
    }

    console.log(`✅ Login successful via ${authMethod} for:`, user.username);

    // Buat JWT token
    const token = createAdminToken({
      userId: user.id, 
      username: user.username, 
      role: user.role,
      permissions: user.permissions 
    });

    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' 
      },
      body: JSON.stringify({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          permissions: user.permissions
        },
        authMethod // Untuk debugging
      })
    };

  } catch (error) {
    console.error('💥 Login error:', error);
    
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        error: 'Terjadi kesalahan internal server',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};