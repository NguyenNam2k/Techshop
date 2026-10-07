const db = require('../config/db');

const ManagerRepository = {
  findByAccount: async (account) => {
    const [rows] = await db.query(
      'SELECT id, username, manager_code, email, password_hash, full_name as name, status FROM managers WHERE username = ? OR manager_code = ?',
      [account, account]
    );
    return rows[0] || null;
  },

  findByUsername: async (username) => {
    const [rows] = await db.query('SELECT * FROM managers WHERE username = ?', [username]);
    return rows[0] || null;
  },

  findByIdForProfile: async (id) => {
    const [rows] = await db.query('SELECT id, username, email, status, created_at, full_name as name, phone, avatar_url FROM managers WHERE id = ?', [id]);
    return rows[0] || null;
  },

  // === Các hàm dành cho Admin Management ===
  findAll: async () => {
    const [rows] = await db.query(
      'SELECT id, username, manager_code, email, full_name as name, phone, branch_name, status, created_at FROM managers ORDER BY id ASC'
    );
    return rows;
  },

  findByEmail: async (email) => {
    const [rows] = await db.query('SELECT * FROM managers WHERE email = ?', [email]);
    return rows[0] || null;
  },

  create: async (data) => {
    const { username, manager_code, email, password_hash, full_name, phone, branch_name = 'TechGear Flagship Store', admin_id } = data;
    const [result] = await db.query(
      'INSERT INTO managers (username, manager_code, email, password_hash, full_name, phone, branch_name, admin_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [username || null, manager_code, email, password_hash, full_name, phone, branch_name, admin_id, 'active']
    );
    return result.insertId;
  },

  updateStatus: async (id, status) => {
    await db.query('UPDATE managers SET status = ? WHERE id = ?', [status, id]);
  },

  deleteById: async (id) => {
    const [result] = await db.query('DELETE FROM managers WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
};

module.exports = ManagerRepository;
