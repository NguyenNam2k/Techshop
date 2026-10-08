const { pool } = require('../config/database');
const BaseRepository = require('./baseRepository');

/**
 * Staff Repository
 * Handles direct database access and queries for staffs table.
 */
class StaffRepository extends BaseRepository {
  /**
   * Find all subordinate staff for a manager (or all staff if managerId is null)
   */
  static async findAllByManager(managerId = null) {
    let query = `
      SELECT 
        s.id,
        s.staff_code,
        s.manager_id,
        s.full_name,
        s.email,
        s.phone,
        s.avatar_url,
        s.department,
        s.status,
        s.permissions,
        s.created_at,
        s.updated_at,
        m.full_name AS manager_name
      FROM staffs s
      LEFT JOIN managers m ON s.manager_id = m.id
    `;
    const params = [];

    if (managerId) {
      query += ` WHERE s.manager_id = ?`;
      params.push(managerId);
    }

    query += ` ORDER BY s.id ASC`;

    const [rows] = await pool.query(query, params);
    return rows.map(r => ({
      ...r,
      permissions: typeof r.permissions === 'string' ? JSON.parse(r.permissions) : (r.permissions || {})
    }));
  }

  /**
   * Find single staff member by ID
   */
  static async findById(id, connection = null) {
    const executor = connection || pool;
    const query = `
      SELECT 
        s.*,
        m.full_name AS manager_name
      FROM staffs s
      LEFT JOIN managers m ON s.manager_id = m.id
      WHERE s.id = ?
    `;
    const [rows] = await executor.query(query, [id]);
    if (rows.length === 0) return null;

    const staff = rows[0];
    staff.permissions = typeof staff.permissions === 'string' ? JSON.parse(staff.permissions) : (staff.permissions || {});
    return staff;
  }

  /**
   * Check if staff code exists
   */
  static async findByCode(staffCode, excludeId = null, connection = null) {
    const executor = connection || pool;
    let query = `SELECT id FROM staffs WHERE staff_code = ?`;
    const params = [staffCode];
    if (excludeId) {
      query += ` AND id != ?`;
      params.push(excludeId);
    }
    query += ` LIMIT 1`;
    const [rows] = await executor.query(query, params);
    return rows[0] || null;
  }

  /**
   * Check if email exists
   */
  static async findByEmail(email, excludeId = null, connection = null) {
    const executor = connection || pool;
    let query = `SELECT id FROM staffs WHERE email = ?`;
    const params = [email];
    if (excludeId) {
      query += ` AND id != ?`;
      params.push(excludeId);
    }
    query += ` LIMIT 1`;
    const [rows] = await executor.query(query, params);
    return rows[0] || null;
  }

  /**
   * Insert new staff member
   */
  static async insert(staffData, connection = null) {
    const executor = connection || pool;
    const permissionsJson = typeof staffData.permissions === 'object' 
      ? JSON.stringify(staffData.permissions) 
      : (staffData.permissions || '{}');

    const [result] = await executor.query(
      `INSERT INTO staffs (
        staff_code, 
        manager_id, 
        full_name, 
        email, 
        password_hash, 
        phone, 
        department, 
        status, 
        permissions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        staffData.staff_code,
        staffData.manager_id || 1,
        staffData.full_name,
        staffData.email,
        staffData.password_hash || '$2b$10$defaultHashForDemo',
        staffData.phone || null,
        staffData.department || 'Warehouse',
        staffData.status || 'active',
        permissionsJson
      ]
    );
    return result.insertId;
  }

  /**
   * Update staff member info, department and permissions
   */
  static async update(id, staffData, connection = null) {
    const executor = connection || pool;
    const permissionsJson = typeof staffData.permissions === 'object' 
      ? JSON.stringify(staffData.permissions) 
      : (staffData.permissions !== undefined ? staffData.permissions : null);

    const [result] = await executor.query(
      `UPDATE staffs SET
        staff_code = COALESCE(?, staff_code),
        full_name = COALESCE(?, full_name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        department = COALESCE(?, department),
        status = COALESCE(?, status),
        permissions = COALESCE(?, permissions),
        updated_at = NOW()
      WHERE id = ?`,
      [
        staffData.staff_code || null,
        staffData.full_name || null,
        staffData.email || null,
        staffData.phone || null,
        staffData.department || null,
        staffData.status || null,
        permissionsJson,
        id
      ]
    );
    return result.affectedRows;
  }

  /**
   * Update role (department) and permissions directly
   */
  static async updatePermissions(id, { department, permissions, status }, connection = null) {
    const executor = connection || pool;
    const permissionsJson = typeof permissions === 'object' 
      ? JSON.stringify(permissions) 
      : (permissions || '{}');

    const [result] = await executor.query(
      `UPDATE staffs SET
        department = COALESCE(?, department),
        permissions = ?,
        status = COALESCE(?, status),
        updated_at = NOW()
      WHERE id = ?`,
      [
        department || null,
        permissionsJson,
        status || null,
        id
      ]
    );
    return result.affectedRows;
  }

  /**
   * Delete staff member
   */
  static async delete(id, connection = null) {
    const executor = connection || pool;
    const [result] = await executor.query(
      `DELETE FROM staffs WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = StaffRepository;
