const db = require('../config/db');

const Permission = {
  findAll: async () => {
    const [rows] = await db.query(
      'SELECT id, permission_name, description, module, created_at, updated_at FROM permissions ORDER BY module, permission_name'
    );
    return rows;
  },

  findById: async (id) => {
    const [rows] = await db.query('SELECT * FROM permissions WHERE id = ?', [id]);
    return rows[0] || null;
  },

  findByName: async (permissionName) => {
    const [rows] = await db.query('SELECT * FROM permissions WHERE permission_name = ?', [permissionName]);
    return rows[0] || null;
  },

  findByModule: async (module) => {
    const [rows] = await db.query(
      'SELECT * FROM permissions WHERE module = ? ORDER BY permission_name',
      [module]
    );
    return rows;
  },

  create: async (data) => {
    const name = data.permission_name.trim().toLowerCase();
    const description = data.description ? data.description.trim() : null;
    const module = data.module ? data.module.trim().toLowerCase() : 'general';
    const [result] = await db.query(
      'INSERT INTO permissions (permission_name, description, module) VALUES (?, ?, ?)',
      [name, description, module]
    );
    return result.insertId;
  },

  update: async (id, data) => {
    const fields = [];
    const values = [];

    if (data.permission_name !== undefined) {
      fields.push('permission_name = ?');
      values.push(data.permission_name.trim().toLowerCase());
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      values.push(data.description ? data.description.trim() : null);
    }
    if (data.module !== undefined) {
      fields.push('module = ?');
      values.push(data.module.trim().toLowerCase());
    }

    if (fields.length === 0) return false;

    values.push(id);
    await db.query(`UPDATE permissions SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  },

  delete: async (id) => {
    const [result] = await db.query('DELETE FROM permissions WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  // Lấy tất cả module duy nhất
  getModules: async () => {
    const [rows] = await db.query('SELECT DISTINCT module FROM permissions ORDER BY module');
    return rows.map(r => r.module);
  }
};

module.exports = Permission;
