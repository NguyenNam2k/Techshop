const mysql = require('mysql2/promise');
require('dotenv').config();
async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'techshop_db',
    port: process.env.DB_PORT || 3306
  });
  await conn.execute('ALTER TABLE customers DROP COLUMN is_verified, DROP COLUMN otp_code, DROP COLUMN otp_expires_at');
  await conn.end();
  console.log('Dropped columns');
}
run();
