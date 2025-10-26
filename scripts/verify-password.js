// scripts/verify-password.js
const bcrypt = require('bcryptjs');

async function verifyPassword() {
  const password = 'admin123';
  const storedHash = '$2a$10$rOzZJb.T2cK.8v7oY8qyE.FzY0pU3nK3QY9XqY9XqY9XqY9XqY9Xq';
  
  console.log('Testing password verification:');
  console.log('Password:', password);
  console.log('Stored Hash:', storedHash);
  
  const isValid = await bcrypt.compare(password, storedHash);
  console.log('Password matches hash:', isValid);
  
  // Generate new hash untuk comparison
  const newHash = await bcrypt.hash(password, 10);
  console.log('New hash for same password:', newHash);
  console.log('New hash matches stored:', await bcrypt.compare(password, newHash));
}

verifyPassword();