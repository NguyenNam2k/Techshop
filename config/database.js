const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'techshop_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  decimalNumbers: true
});

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Kết nối MySQL Database (techshop_db) thành công!');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Lỗi kết nối MySQL Database:', error.message);
    return false;
  }
}

module.exports = {
  pool,
  testConnection
};
