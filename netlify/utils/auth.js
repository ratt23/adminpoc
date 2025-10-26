// netlify/utils/auth.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// ==================== TOKEN AKSES PASIEN ====================
/**
 * Membuat token akses acak yang aman untuk pasien.
 * Fungsi ini tidak memerlukan argumen.
 */
const createPatientToken = () => {
  // Membuat 16 byte acak dan mengubahnya menjadi string hexadecimal
  // Ini akan menghasilkan token 32 karakter (misal: a4b1c8e...f0)
  return crypto.randomBytes(16).toString('hex');
};

// ==================== TOKEN AUTENTIKASI ADMIN ====================
// Buat JWT secret yang konsisten
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-development-only-change-in-production';

// Warning jika menggunakan fallback
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  WARNING: JWT_SECRET environment variable not set. Using fallback secret. This is insecure for production!');
}

/**
 * Memverifikasi token JWT untuk admin
 */
const verifyAdminToken = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Invalid auth header format');
    return null;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    console.log('No token found in auth header');
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token verified successfully for user:', decoded.username);
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
};

/**
 * Membuat token JWT untuk admin
 */
const createAdminToken = (payload) => {
  return jwt.sign(
    payload,
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// ==================== BACKWARD COMPATIBILITY ====================
// Pertahankan fungsi createToken lama untuk kompatibilitas dengan kode yang sudah ada
const createToken = createPatientToken;

// Ekspor semua fungsi
module.exports = {
  // Fungsi untuk token pasien (legacy dan baru)
  createToken,        // Legacy - untuk kompatibilitas
  createPatientToken, // Baru - lebih eksplisit
  
  // Fungsi untuk token admin
  verifyAdminToken,
  createAdminToken,
  
  // Export JWT_SECRET untuk digunakan di tempat lain jika diperlukan
  JWT_SECRET
};
