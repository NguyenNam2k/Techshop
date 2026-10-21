const { pool } = require('../../config/database');
const BaseRepository = require('../baseRepository');

/**
 * Staff Repository
 * Handles direct database access and queries for staffs table,
 * subordinate staff management, role delegation, tasks & schedules,
 * as well as authentication and administrative lookups.
 */
class StaffRepository extends BaseRepository {
  // =========================================================================
  // AUTHENTICATION & PROFILE METHODS (Inter-1 & Inter-2 Core)
  // =========================================================================

  static async findByAccount(account) {
    const [rows] = await pool.query(
      'SELECT id, username, staff_code, email, password_hash, full_name as name, status FROM staffs WHERE username = ? OR staff_code = ?',
      [account, account]
    );
    return rows[0] || null;
  }

  static async findByUsername(username) {
    const [rows] = await pool.query('SELECT * FROM staffs WHERE username = ?', [username]);
    return rows[0] || null;
  }

  static async findByIdForProfile(id) {
    const [rows] = await pool.query(
      'SELECT id, username, email, status, created_at, full_name as name, phone, avatar_url FROM staffs WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  static async create(data) {
    const { username, staff_code, email, password_hash, full_name, phone, department = 'Warehouse', manager_id } = data;
    const [result] = await pool.query(
      'INSERT INTO staffs (username, staff_code, email, password_hash, full_name, phone, department, manager_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [username || null, staff_code, email, password_hash, full_name, phone, department, manager_id, 'active']
    );
    return result.insertId;
  }

  static async updateStatus(id, status) {
    await pool.query('UPDATE staffs SET status = ? WHERE id = ?', [status, id]);
  }

  static async deleteById(id) {
    const [result] = await pool.query('DELETE FROM staffs WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  // =========================================================================
  // SUBORDINATE STAFF MANAGEMENT (Manager Portal MNG-05)
  // =========================================================================

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
   * Find all staff
   */
  static async findAll() {
    const [rows] = await pool.query(
      'SELECT id, username, staff_code, email, full_name as name, phone, department, status, created_at FROM staffs ORDER BY id ASC'
    );
    return rows;
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

  // =========================================================================
  // STAFF TASKS (Assign Tasks Use Case)
  // =========================================================================

  /**
   * Find tasks with optional staff filter
   */
  static async findTasks({ staff_id = null, status = 'all' } = {}) {
    let query = `
      SELECT 
        t.*,
        s.full_name AS staff_name,
        s.department AS staff_department,
        s.staff_code
      FROM staff_tasks t
      JOIN staffs s ON t.staff_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (staff_id) {
      query += ` AND t.staff_id = ?`;
      params.push(parseInt(staff_id, 10));
    }

    if (status !== 'all') {
      query += ` AND t.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY FIELD(t.priority, 'urgent', 'high', 'medium', 'low'), t.due_date ASC, t.id DESC`;

    const [rows] = await pool.query(query, params);
    return rows;
  }

  /**
   * Create new assigned task
   */
  static async createTask({ staff_id, manager_id = 1, title, description, priority = 'medium', due_date = null }) {
    const [result] = await pool.query(
      `INSERT INTO staff_tasks (staff_id, manager_id, title, description, priority, status, due_date)
       VALUES (?, ?, ?, ?, ?, 'todo', ?)`,
      [
        parseInt(staff_id, 10),
        parseInt(manager_id, 10) || 1,
        title.trim(),
        description || null,
        priority || 'medium',
        due_date || null
      ]
    );
    return result.insertId;
  }

  /**
   * Update task status (todo -> in_progress -> completed -> cancelled)
   */
  static async updateTaskStatus(taskId, status) {
    const [result] = await pool.query(
      `UPDATE staff_tasks SET status = ?, updated_at = NOW() WHERE id = ?`,
      [status, parseInt(taskId, 10)]
    );
    return result.affectedRows > 0;
  }

  /**
   * Delete assigned task
   */
  static async deleteTask(taskId) {
    const [result] = await pool.query(
      `DELETE FROM staff_tasks WHERE id = ?`,
      [parseInt(taskId, 10)]
    );
    return result.affectedRows > 0;
  }

  // =========================================================================
  // WORKING SCHEDULE (View Working Schedule Use Case)
  // =========================================================================

  /**
   * Find schedules with optional date or staff filter
   */
  static async findSchedules({ work_date = null, staff_id = null } = {}) {
    let query = `
      SELECT 
        sc.*,
        s.full_name AS staff_name,
        s.staff_code,
        s.department
      FROM staff_schedules sc
      JOIN staffs s ON sc.staff_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (work_date) {
      query += ` AND sc.work_date = ?`;
      params.push(work_date);
    }

    if (staff_id) {
      query += ` AND sc.staff_id = ?`;
      params.push(parseInt(staff_id, 10));
    }

    query += ` ORDER BY sc.work_date ASC, FIELD(sc.shift, 'morning', 'afternoon', 'evening')`;

    const [rows] = await pool.query(query, params);
    return rows;
  }

  /**
   * Create work shift schedule
   */
  static async createSchedule({ staff_id, work_date, shift, note }) {
    const [result] = await pool.query(
      `INSERT INTO staff_schedules (staff_id, work_date, shift, note)
       VALUES (?, ?, ?, ?)`,
      [
        parseInt(staff_id, 10),
        work_date,
        shift,
        note || null
      ]
    );
    return result.insertId;
  }

  /**
   * Delete schedule
   */
  static async deleteSchedule(scheduleId) {
    const [result] = await pool.query(
      `DELETE FROM staff_schedules WHERE id = ?`,
      [parseInt(scheduleId, 10)]
    );
    return result.affectedRows > 0;
  }

  // =========================================================================
  // STAFF PERFORMANCE (View Staff Performance Use Case)
  // =========================================================================

  /**
   * Calculate staff performance & KPI metrics
   */
  static async getStaffPerformance() {
    const [rows] = await pool.query(`
      SELECT 
        s.id,
        s.staff_code,
        s.full_name,
        s.department,
        s.status,
        COUNT(t.id) AS total_tasks,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) AS completed_tasks,
        SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_tasks,
        SUM(CASE WHEN t.status = 'todo' THEN 1 ELSE 0 END) AS todo_tasks,
        SUM(CASE WHEN t.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_tasks
      FROM staffs s
      LEFT JOIN staff_tasks t ON s.id = t.staff_id
      GROUP BY s.id, s.staff_code, s.full_name, s.department, s.status
      ORDER BY completed_tasks DESC, s.id ASC
    `);

    return rows.map(r => {
      const total = parseInt(r.total_tasks, 10) || 0;
      const completed = parseInt(r.completed_tasks, 10) || 0;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 100;
      let rating = 'Xuất sắc';
      if (rate < 60) rating = 'Cần cải thiện';
      else if (rate < 80) rating = 'Khá';
      else if (rate < 90) rating = 'Tốt';

      return {
        ...r,
        completion_rate: rate,
        kpi_score: Math.min(100, Math.round(rate * 0.9 + (completed > 0 ? 10 : 0))),
        rating
      };
    });
  }
}

module.exports = StaffRepository;
