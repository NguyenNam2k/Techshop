const { pool } = require('../../config/database');
const BaseRepository = require('../baseRepository');

class PermissionRepository extends BaseRepository {
  /**
   * Lấy toàn bộ danh sách quyền hạn
   */
  static async findAll() {
    const [rows] = await pool.query('SELECT * FROM permissions ORDER BY module ASC, id ASC');
    return rows;
  }

  /**
   * Tìm quyền theo ID
   */
  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM permissions WHERE id = ?', [id]);
    return rows[0] || null;
  }

  /**
   * Lấy danh sách quyền theo Module
   */
  static async findByModule(moduleName) {
    const [rows] = await pool.query('SELECT * FROM permissions WHERE module = ? ORDER BY id ASC', [moduleName]);
    return rows;
  }

  /**
   * Tạo quyền mới
   */
  static async create({ permission_name, description = '', module = 'general' }) {
    const query = `INSERT INTO permissions (permission_name, description, module) VALUES (?, ?, ?)`;
    const [result] = await pool.query(query, [permission_name, description, module]);
    return result.insertId;
  }

  /**
   * Cập nhật quyền
   */
  static async update(id, { description, module }) {
    const updates = [];
    const params = [];

    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (module !== undefined) {
      updates.push('module = ?');
      params.push(module);
    }

    if (updates.length === 0) return false;

    params.push(id);
    const query = `UPDATE permissions SET ${updates.join(', ')} WHERE id = ?`;
    const [result] = await pool.query(query, params);
    return result.affectedRows > 0;
  }

  /**
   * Xóa quyền
   */
  static async delete(id) {
    const [result] = await pool.query('DELETE FROM permissions WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = PermissionRepository;
