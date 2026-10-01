const db = require('../config/db');

const Role = {
  findAll: async () => {
    const [rows] = await db.query(
      'SELECT id, role_name, description, is_active, created_at, updated_at FROM roles ORDER BY id ASC'
    );
    return rows;
  },

  findById: async (id) => {
    const [rows] = await db.query('SELECT * FROM roles WHERE id = ?', [id]);
    return rows[0] || null;
  },

  findByName: async (roleName) => {
    const [rows] = await db.query('SELECT * FROM roles WHERE role_name = ?', [roleName]);
    return rows[0] || null;
  },

  create: async (data) => {
    const name = data.role_name.trim().toLowerCase();
    const description = data.description ? data.description.trim() : null;
    const [result] = await db.query(
      'INSERT INTO roles (role_name, description) VALUES (?, ?)',
      [name, description]
    );
    return result.insertId;
  },

  update: async (id, data) => {
    const fields = [];
    const values = [];

    if (data.role_name !== undefined) {
      fields.push('role_name = ?');
      values.push(data.role_name.trim().toLowerCase());
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      values.push(data.description ? data.description.trim() : null);
    }
    if (data.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(data.is_active);
    }

    if (fields.length === 0) return false;

    values.push(id);
    await db.query(`UPDATE roles SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  },

  delete: async (id) => {
    const [result] = await db.query('DELETE FROM roles WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  // Lấy danh sách permissions của một role
  getPermissions: async (roleId) => {
    const [rows] = await db.query(
      `SELECT p.id, p.permission_name, p.description, p.module
       FROM permissions p
       INNER JOIN role_permissions rp ON rp.permission_id = p.id
       WHERE rp.role_id = ?
       ORDER BY p.module, p.permission_name`,
      [roleId]
    );
    return rows;
  },

  // Gán danh sách permissions cho role (xóa cũ, thêm mới)
  assignPermissions: async (roleId, permissionIds) => {
    // Xóa tất cả quyền cũ
    await db.query('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);

    // Thêm quyền mới
    if (permissionIds.length > 0) {
      const values = permissionIds.map(pid => [roleId, pid]);
      await db.query(
        'INSERT INTO role_permissions (role_id, permission_id) VALUES ?',
        [values]
      );
    }
    return true;
  }
};

module.exports = Role;
