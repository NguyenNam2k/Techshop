const db = require('../config/db');

const CustomerRepository = {
  findByEmail: async (email) => {
    const [rows] = await db.query('SELECT * FROM customers WHERE email = ?', [email]);
    return rows[0] || null;
  },

  findByUsername: async (username) => {
    const [rows] = await db.query('SELECT * FROM customers WHERE username = ?', [username]);
    return rows[0] || null;
  },

  findByAccount: async (account) => {
    const [rows] = await db.query(
      'SELECT id, username, email, password_hash, name, status FROM customers WHERE username = ?',
      [account]
    );
    return rows[0] || null;
  },
  
  findByEmailForLogin: async (email) => {
    const [rows] = await db.query(
      'SELECT id, username, email, password_hash, name, status FROM customers WHERE username = ?',
      [email]
    );
    return rows[0] || null;
  },

  findByGoogleId: async (googleId) => {
    const [rows] = await db.query('SELECT id, name, username, email, google_id, status FROM customers WHERE google_id = ?', [googleId]);
    return rows[0] || null;
  },

  findByIdForProfile: async (id) => {
    const [rows] = await db.query('SELECT id, username, email, status, created_at, name, phone, address, avatar_url FROM customers WHERE id = ?', [id]);
    return rows[0] || null;
  },

  create: async (customerData) => {
    const { name, username, email, password_hash, phone, address, status = 'active' } = customerData;
    const [result] = await db.query(
      'INSERT INTO customers (name, username, email, password_hash, phone, address, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, username, email, password_hash, phone, address, status]
    );
    return result.insertId;
  },

  createFromGoogle: async (customerData) => {
    const { name, username, email, google_id, avatar_url, status = 'active' } = customerData;
    const [result] = await db.query(
      'INSERT INTO customers (name, username, email, google_id, avatar_url, password_hash, status) VALUES (?, ?, ?, ?, ?, NULL, ?)',
      [name, username, email, google_id, avatar_url, status]
    );
    return result.insertId;
  },

  updateGoogleId: async (id, googleId, avatarUrl) => {
    await db.query(
      'UPDATE customers SET google_id = ?, avatar_url = COALESCE(avatar_url, ?) WHERE id = ?',
      [googleId, avatarUrl, id]
    );
  },

  // === Các hàm dành cho Admin ===
  findAll: async () => {
    const [rows] = await db.query(
      'SELECT id, username, name, email, phone, address, status, created_at FROM customers ORDER BY id ASC'
    );
    return rows;
  },

  updateStatus: async (id, status) => {
    await db.query('UPDATE customers SET status = ? WHERE id = ?', [status, id]);
  },

  deleteById: async (id) => {
    const [result] = await db.query('DELETE FROM customers WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
};

module.exports = CustomerRepository;
