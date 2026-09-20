const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'techshop_db',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Kiểm tra kết nối CSDL khi khởi tạo
pool.getConnection()
  .then(connection => {
    console.log(`[MySQL] Kết nối thành công tới CSDL "${process.env.DB_NAME || 'techshop_db'}" tại ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
    connection.release();
  })
  .catch(err => {
    console.error('[MySQL Error] Không thể kết nối CSDL MySQL:', err.message);
    console.error('Vui lòng kiểm tra lại cấu hình .env và đảm bảo đã chạy Script.sql trong MySQL!');
  });

module.exports = pool;
