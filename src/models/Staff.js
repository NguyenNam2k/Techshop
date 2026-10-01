const db = require('../config/db');

const Staff = {
  findByAccount: async (account) => {
    const [rows] = await db.query(
      'SELECT id, staff_code, email, password_hash, full_name as name, status FROM staffs WHERE email = ? OR staff_code = ?',
      [account, account]
    );
    return rows[0] || null;
  },
  findByIdForProfile: async (id) => {
    const [rows] = await db.query('SELECT id, email, status, created_at, full_name as name, phone, avatar_url FROM staffs WHERE id = ?', [id]);
    return rows[0] || null;
  }
};
module.exports = Staff;
