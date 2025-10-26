// scripts/create-users.js
const bcrypt = require('bcryptjs');
const { db } = require('../netlify/utils/database');

async function createUsers() {
  try {
    const password = 'password123';
    const hash = await bcrypt.hash(password, 10);
    
    console.log('Password:', password);
    console.log('Hash:', hash);
    
    // Hapus tabel jika ada
    await db.query(`
      DROP TABLE IF EXISTS users;
    `);
    
    // Buat tabel
    await db.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        permissions JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      );
    `);
    
    // Insert users
    await db.query(`
      INSERT INTO users (username, password_hash, role, permissions) VALUES 
      ($1, $2, $3, $4),
      ($5, $6, $7, $8),
      ($9, $10, $11, $12)
    `, [
      'admin', hash, 'admin', '{"all_access": true}',
      'naomi.nanariarin', hash, 'exporter', '{"export_csv": true, "view_patients": true}',
      'adminpoc', hash, 'admin_poc', '{"view_patients": true, "add_patient": true, "edit_patient": true, "delete_patient": true, "export_csv": true}'
    ]);
    
    console.log('✅ Users created successfully!');
    console.log('Username: admin, Password: password123');
    console.log('Username: naomi.nanariarin, Password: password123');
    console.log('Username: adminpoc, Password: password123');
    
  } catch (error) {
    console.error('Error creating users:', error);
  }
}

createUsers();