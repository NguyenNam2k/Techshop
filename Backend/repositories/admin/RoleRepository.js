const { pool } = require('../../config/database');
const BaseRepository = require('../baseRepository');

class RoleRepository extends BaseRepository {
  /**
   * Lấy danh sách tất cả vai trò kèm số lượng quyền đã gán
   */
  static async findAll() {
    const query = `
      SELECT 
        r.id,
        r.role_name,
        r.description,
        r.is_active,
        r.created_at,
        r.updated_at,
        COUNT(rp.permission_id) AS permission_count
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      GROUP BY r.id
      ORDER BY r.id ASC
    `;
    const [rows] = await pool.query(query);
    return rows;
  }

  /**
   * Lấy chi tiết 1 vai trò theo ID kèm danh sách quyền
   */
  static async findById(id) {
    const [roles] = await pool.query('SELECT * FROM roles WHERE id = ?', [id]);
    if (!roles || roles.length === 0) return null;

    const role = roles[0];
    const [perms] = await pool.query(
      `SELECT p.id, p.permission_name, p.description, p.module
       FROM permissions p
       INNER JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = ?`,
      [id]
    );
    role.permissions = perms;
    return role;
  }

  /**
   * Tìm vai trò theo role_name
   */
  static async findByRoleName(roleName) {
    const [rows] = await pool.query('SELECT * FROM roles WHERE role_name = ?', [roleName]);
    return rows[0] || null;
  }

  /**
   * Tạo vai trò mới
   */
  static async create({ role_name, description = '', is_active = 1 }) {
    const query = `INSERT INTO roles (role_name, description, is_active) VALUES (?, ?, ?)`;
    const [result] = await pool.query(query, [role_name, description, is_active]);
    return result.insertId;
  }

  /**
   * Cập nhật thông tin vai trò
   */
  static async update(id, { description, is_active }) {
    const updates = [];
    const params = [];

    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active ? 1 : 0);
    }

    if (updates.length === 0) return false;

    params.push(id);
    const query = `UPDATE roles SET ${updates.join(', ')} WHERE id = ?`;
    const [result] = await pool.query(query, params);
    return result.affectedRows > 0;
  }

  /**
   * Xóa vai trò (không cho phép xóa các vai trò cốt lõi)
   */
  static async delete(id) {
    const systemRoles = ['super_admin', 'system_admin', 'admin', 'manager', 'staff', 'customer'];
    const [rows] = await pool.query('SELECT role_name FROM roles WHERE id = ?', [id]);
    if (rows.length === 0) return false;
    if (systemRoles.includes(rows[0].role_name.toLowerCase())) {
      throw new Error('Không thể xóa vai trò mặc định của hệ thống!');
    }

    const [result] = await pool.query('DELETE FROM roles WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  /**
   * Lấy danh sách ID quyền hạn của 1 vai trò
   */
  static async getPermissions(roleId) {
    const query = `
      SELECT p.id, p.permission_name, p.description, p.module
      FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ?
    `;
    const [rows] = await pool.query(query, [roleId]);
    return rows;
  }

  /**
   * Gán danh sách quyền cho vai trò (Giao dịch Transaction)
   */
  static async setPermissions(roleId, permissionIds = []) {
    const connection = await this.getConnection();
    try {
      await this.beginTransaction(connection);

      // Xóa tất cả quyền cũ của role
      await connection.query('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);

      // Thêm các quyền mới
      if (Array.isArray(permissionIds) && permissionIds.length > 0) {
        const values = permissionIds.map((pId) => [roleId, pId]);
        await connection.query(
          'INSERT INTO role_permissions (role_id, permission_id) VALUES ?',
          [values]
        );
      }

      await this.commit(connection);
      return true;
    } catch (error) {
      await this.rollback(connection);
      throw error;
    } finally {
      this.releaseConnection(connection);
    }
  }
}

module.exports = RoleRepository;
