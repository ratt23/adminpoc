// netlify/functions/get-all-patients.js
// VERSI UPGRADE (dengan Paginasi, Search, Filter, dan Sort)

const { db } = require('../utils/database');
const { verifyAdminToken } = require('../utils/auth');
const { checkPermission } = require('../utils/permissions');

exports.handler = async function (event, context) {
  console.log('=== get-all-patients (UPGRADED) called ===');
  
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
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' 
      },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  // Cek authorization
  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' 
      },
      body: JSON.stringify({ error: 'Unauthorized' }),
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

    // Check permission untuk view_patients
    if (!checkPermission(decoded, 'view_patients')) {
      return {
        statusCode: 403,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Insufficient permissions' })
      };
    }

    // --- LOGIKA BARU UNTUK SEMUA FITUR ---

    // 1. Ambil semua query parameters
    const { 
      page = 1, 
      limit = 20,
      search = '',
      filterStatus = '', // 'Menunggu' atau 'Disetujui'
      sortBy = 'TimestampDibuat', // Kolom default
      sortOrder = 'DESC' // Urutan default
    } = event.queryStringParameters;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    console.log(`Fetching patients - Page: ${pageNum}, Limit: ${limitNum}, Search: '${search}', Filter: '${filterStatus}', Sort: ${sortBy} ${sortOrder}`);

    // 2. Inisialisasi query builder
    let whereClauses = [];
    let params = [];
    let paramIndex = 1;

    // 3. Bangun klausa WHERE (Search & Filter)
    if (search) {
      // Cari di NamaPasien ATAU NomorMR (case-insensitive)
      whereClauses.push(`("NamaPasien" ILIKE $${paramIndex} OR "NomorMR" ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (filterStatus === 'Menunggu' || filterStatus === 'Disetujui') {
      whereClauses.push(`"StatusPersetujuan" = $${paramIndex}`);
      params.push(filterStatus);
      paramIndex++;
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // 4. Bangun klausa ORDER BY (Sort)
    // Whitelist kolom yang aman untuk disortir
    const validSortColumns = {
      'NomorMR': '"NomorMR"',
      'NamaPasien': '"NamaPasien"',
      'JadwalOperasi': '"JadwalOperasi"',
      'StatusPersetujuan': '"StatusPersetujuan"',
      'TimestampDibuat': '"TimestampDibuat"'
    };

    const sortColumn = validSortColumns[sortBy] || '"TimestampDibuat"'; // Default sort
    const sortDirection = sortOrder === 'ASC' ? 'ASC' : 'DESC'; // Pastikan hanya ASC atau DESC
    
    // Urutan default sekunder untuk konsistensi
    const orderByString = `ORDER BY ${sortColumn} ${sortDirection}, "TimestampDibuat" DESC`;

    // 5. Buat Query untuk Total Count (untuk paginasi)
    const countQuery = `SELECT COUNT(*) as total_count FROM patients ${whereString}`;
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total_count);

    // 6. Buat Query untuk Data Pasien
    const dataQuery = `
      SELECT 
        "NomorMR", 
        "NamaPasien", 
        "JadwalOperasi", 
        COALESCE("Dokter", 'Akan ditentukan') as "Dokter", 
        "StatusPersetujuan", 
        "TimestampPersetujuan", 
        "TokenAkses", 
        COALESCE("Gender", '-') as "Gender", 
        COALESCE("Umur", '-') as "Umur", 
        COALESCE("Diagnosa", '-') as "Diagnosa", 
        COALESCE("Payer", '-') as "Payer", 
        COALESCE("Kelas", '-') as "Kelas", 
        COALESCE("Skala", '-') as "Skala",
        "TimestampDibuat"
       FROM patients 
       ${whereString}
       ${orderByString}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    // Tambahkan parameter limit dan offset ke params
    params.push(limitNum, offset);
    
    const result = await db.query(dataQuery, params);

    console.log(`Query successful, found ${result.rows.length} patients out of ${total}`);

    // --- AKHIR LOGIKA BARU ---

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        patients: result.rows,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }),
    };
  } catch (error) {
    console.error('Error fetching patients:', error);
    console.error('Error stack:', error.stack);
    
    return {
      statusCode: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' 
      },
      body: JSON.stringify({ 
        error: 'Gagal mengambil data pasien',
        details: error.message,
        suggestion: 'Pastikan database sudah terhubung dan tabel patients sudah dibuat'
      }),
    };
  }
};