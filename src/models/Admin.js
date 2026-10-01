const db = require('../config/db');

const Admin = {
  findByAccount: async (account) => {
    const [rows] = await db.query(
      'SELECT id, username, email, password_hash, full_name as name, status FROM admins WHERE email = ? OR username = ?',
      [account, account]
    );
    return rows[0] || null;
  },
  findByIdForProfile: async (id) => {
    const [rows] = await db.query('SELECT id, email, status, created_at, full_name as name, phone, avatar_url FROM admins WHERE id = ?', [id]);
    return rows[0] || null;
  }
};
module.exports = Admin;
