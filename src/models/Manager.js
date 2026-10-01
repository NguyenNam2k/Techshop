const db = require('../config/db');

const Manager = {
  findByAccount: async (account) => {
    const [rows] = await db.query(
      'SELECT id, manager_code, email, password_hash, full_name as name, status FROM managers WHERE email = ? OR manager_code = ?',
      [account, account]
    );
    return rows[0] || null;
  },
  findByIdForProfile: async (id) => {
    const [rows] = await db.query('SELECT id, email, status, created_at, full_name as name, phone, avatar_url FROM managers WHERE id = ?', [id]);
    return rows[0] || null;
  }
};
module.exports = Manager;
