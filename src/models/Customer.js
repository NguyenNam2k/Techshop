const db = require('../config/db');

const Customer = {
  findByEmail: async (email) => {
    const [rows] = await db.query('SELECT * FROM customers WHERE email = ?', [email]);
    return rows[0] || null;
  },
  
  findByEmailForLogin: async (email) => {
     const [rows] = await db.query(
        'SELECT id, email, password_hash, name, status FROM customers WHERE email = ?',
        [email]
      );
      return rows[0] || null;
  },

  findByGoogleId: async (googleId) => {
    const [rows] = await db.query('SELECT id, name, email, google_id, status FROM customers WHERE google_id = ?', [googleId]);
    return rows[0] || null;
  },

  findByIdForProfile: async (id) => {
    const [rows] = await db.query('SELECT id, email, status, created_at, name, phone, address, avatar_url FROM customers WHERE id = ?', [id]);
    return rows[0] || null;
  },

  create: async (customerData) => {
    const { name, email, password_hash, phone, address, status = 'active' } = customerData;
    const [result] = await db.query(
      'INSERT INTO customers (name, email, password_hash, phone, address, status) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, password_hash, phone, address, status]
    );
    return result.insertId;
  },

  createFromGoogle: async (customerData) => {
    const { name, email, google_id, avatar_url, status = 'active' } = customerData;
    const [result] = await db.query(
      'INSERT INTO customers (name, email, google_id, avatar_url, password_hash, status) VALUES (?, ?, ?, ?, NULL, ?)',
      [name, email, google_id, avatar_url, status]
    );
    return result.insertId;
  },

  updateGoogleId: async (id, googleId, avatarUrl) => {
    await db.query(
      'UPDATE customers SET google_id = ?, avatar_url = COALESCE(avatar_url, ?) WHERE id = ?',
      [googleId, avatarUrl, id]
    );
  }
};

module.exports = Customer;
