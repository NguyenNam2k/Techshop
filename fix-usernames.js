/**
 * fix-usernames.js
 * Script tự động cập nhật username DUY NHẤT cho tất cả tài khoản cũ còn NULL trong Database
 * Chạy: node fix-usernames.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixUsernames() {
  console.log('🚀 Đang kết nối tới Database để cập nhật username cho các tài khoản cũ...\n');

  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'techshop_db',
    port:     process.env.DB_PORT     || 3306,
  });

  const tables = ['customers', 'managers', 'staffs', 'admins'];

  for (const table of tables) {
    console.log(`📌 Kiểm tra bảng [${table}]...`);
    const [rows] = await conn.execute(`SELECT id, email, username FROM ${table}`);
    
    // Lưu tập hợp username đã tồn tại để tránh trùng lặp
    const existingUsernames = new Set();
    rows.forEach(r => { if (r.username) existingUsernames.add(r.username.toLowerCase()); });

    let updatedCount = 0;

    for (const user of rows) {
      if (!user.username) {
        // Lấy phần tên trước ký tự @ của email
        let baseUsername = user.email ? user.email.split('@')[0].toLowerCase() : `user_${user.id}`;
        // Loại bỏ ký tự đặc biệt
        baseUsername = baseUsername.replace(/[^a-z0-9_]/g, '');
        if (!baseUsername) baseUsername = `user_${user.id}`;

        let candidate = baseUsername;
        let counter = 1;

        // Nếu bị trùng username với người khác -> tự thêm ID hoặc số đằng sau
        while (existingUsernames.has(candidate)) {
          candidate = `${baseUsername}_${user.id || counter}`;
          counter++;
        }

        // Cập nhật vào DB
        await conn.execute(`UPDATE ${table} SET username = ? WHERE id = ?`, [candidate, user.id]);
        existingUsernames.add(candidate);
        updatedCount++;
        console.log(`   ✓ ID #${user.id} (${user.email}) ➔ Username: "${candidate}"`);
      }
    }

    if (updatedCount === 0) {
      console.log(`   ℹ Tất cả tài khoản trong [${table}] đã có username.`);
    } else {
      console.log(`   ✅ Đã cập nhật thành công ${updatedCount} tài khoản trong [${table}].\n`);
    }
  }

  await conn.end();
  console.log('🎉 BÁO CÁO: Đã hoàn tất tự động điền Username cho toàn bộ CSDL!');
}

fixUsernames().catch((err) => {
  console.error('\n❌ Lỗi khi cập nhật:', err.message);
  process.exit(1);
});
