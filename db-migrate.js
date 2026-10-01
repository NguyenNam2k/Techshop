const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
  try {
    console.log('Connecting to database...');
    const conn = await mysql.createConnection({
      host:     process.env.DB_HOST     || 'localhost',
      user:     process.env.DB_USER     || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME     || 'techshop_db',
      port:     process.env.DB_PORT     || 3306,
    });

    console.log('Altering customers table...');
    // Không dùng IF NOT EXISTS cho MariaDB cũ để an toàn, bắt catch
    try {
      await conn.execute(`
        ALTER TABLE customers 
        ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN otp_code VARCHAR(10) NULL,
        ADD COLUMN otp_expires_at TIMESTAMP NULL
      `);
    } catch(e) {
      if(e.code === 'ER_DUP_FIELDNAME') console.log('Columns already exist.');
      else throw e;
    }

    // Tự động mark những tài khoản cũ (seed accounts) là đã verify
    await conn.execute(`
      UPDATE customers SET is_verified = TRUE WHERE status = 'active'
    `);

    console.log('Migration completed successfully!');
    await conn.end();
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

migrate();
