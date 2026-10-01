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
  },

  // === Các hàm dành cho Admin Management ===
  findAll: async () => {
    const [rows] = await db.query(
      'SELECT id, staff_code, email, full_name as name, phone, department, status, created_at FROM staffs ORDER BY id DESC'
    );
    return rows;
  },

  findByEmail: async (email) => {
    const [rows] = await db.query('SELECT * FROM staffs WHERE email = ?', [email]);
    return rows[0] || null;
  },

  create: async (data) => {
    const { staff_code, email, password_hash, full_name, phone, department = 'Warehouse', manager_id } = data;
    const [result] = await db.query(
      'INSERT INTO staffs (staff_code, email, password_hash, full_name, phone, department, manager_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [staff_code, email, password_hash, full_name, phone, department, manager_id, 'active']
    );
    return result.insertId;
  },

  updateStatus: async (id, status) => {
    await db.query('UPDATE staffs SET status = ? WHERE id = ?', [status, id]);
  },

  deleteById: async (id) => {
    const [result] = await db.query('DELETE FROM staffs WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
};

module.exports = Staff;
