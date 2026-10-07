const db = require('../config/db');

const AdminRepository = {
  findByAccount: async (account) => {
    const [rows] = await db.query(
      'SELECT id, username, email, password_hash, full_name as name, status FROM admins WHERE username = ?',
      [account]
    );
    return rows[0] || null;
  },

  findByUsername: async (username) => {
    const [rows] = await db.query('SELECT * FROM admins WHERE username = ?', [username]);
    return rows[0] || null;
  },

  findByIdForProfile: async (id) => {
    const [rows] = await db.query('SELECT id, username, email, status, created_at, full_name as name, phone, avatar_url FROM admins WHERE id = ?', [id]);
    return rows[0] || null;
  },

  // === Các hàm dành cho Admin Management ===
  findAll: async () => {
    const [rows] = await db.query(
      'SELECT id, username, email, full_name as name, phone, security_level, status, created_at FROM admins ORDER BY id ASC'
    );
    return rows;
  },

  findByEmail: async (email) => {
    const [rows] = await db.query('SELECT * FROM admins WHERE email = ?', [email]);
    return rows[0] || null;
  },

  create: async (data) => {
    const { username, email, password_hash, full_name, phone, security_level = 'system_admin' } = data;
    const [result] = await db.query(
      'INSERT INTO admins (username, email, password_hash, full_name, phone, security_level, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [username, email, password_hash, full_name, phone, security_level, 'active']
    );
    return result.insertId;
  },

  updateStatus: async (id, status) => {
    await db.query('UPDATE admins SET status = ? WHERE id = ?', [status, id]);
  },

  deleteById: async (id) => {
    const [result] = await db.query('DELETE FROM admins WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
};

module.exports = AdminRepository;
