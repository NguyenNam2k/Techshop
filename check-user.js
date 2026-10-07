const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkUser() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'techshop_db',
    port:     process.env.DB_PORT     || 3306,
  });

  const [rows] = await conn.execute("SELECT id, username, email, password_hash, google_id, status FROM customers WHERE username = 'tunnhe170309' OR email LIKE '%tunnhe%'");
  console.log('User search result:', JSON.stringify(rows, null, 2));

  await conn.end();
}

checkUser().catch(console.error);
