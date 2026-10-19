const { pool } = require('../config/database');
const BaseRepository = require('./baseRepository');

/**
 * Log Repository
 * Handles direct database access and queries for inventory_logs and audit_logs tables.
 */
class LogRepository extends BaseRepository {
  /**
   * Insert a new record into inventory_logs
   */
  static async insertInventoryLog({
    variant_id,
    staff_id = null,
    manager_id = null,
    change_type,
    quantity_changed,
    stock_after,
    note
  }, connection = null) {
    const executor = connection || pool;
    const [result] = await executor.query(
      `INSERT INTO inventory_logs (
        variant_id, 
        staff_id, 
        manager_id, 
        change_type, 
        quantity_changed, 
        stock_after, 
        note
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        variant_id,
        staff_id,
        manager_id,
        change_type,
        quantity_changed,
        stock_after,
        note
      ]
    );
    return result.insertId;
  }

  /**
   * Insert a new record into audit_logs
   */
  static async insertAuditLog({
    entity_type = 'product',
    entity_id,
    action,
    old_data = null,
    new_data = null,
    changed_by = 'Manager'
  }, connection = null) {
    const executor = connection || pool;
    const [result] = await executor.query(
      `INSERT INTO audit_logs (
        entity_type, 
        entity_id, 
        action, 
        old_data, 
        new_data, 
        changed_by
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        entity_type,
        entity_id,
        action,
        typeof old_data === 'object' ? JSON.stringify(old_data) : old_data,
        typeof new_data === 'object' ? JSON.stringify(new_data) : new_data,
        changed_by
      ]
    );
    return result.insertId;
  }

  /**
   * Query inventory history logs
   */
  static async getInventoryLogs({ limit = 30, variantId = null, productId = null } = {}) {
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (variantId) {
      whereClause += ' AND l.variant_id = ?';
      params.push(variantId);
    } else if (productId) {
      whereClause += ' AND pv.product_id = ?';
      params.push(productId);
    }

    const sql = `
      SELECT 
        l.id,
        l.variant_id,
        pv.sku,
        p.name AS product_name,
        l.change_type,
        l.quantity_changed,
        l.stock_after,
        l.note,
        l.created_at,
        COALESCE(m.full_name, 'Quản lý kho') AS manager_name
      FROM inventory_logs l
      JOIN product_variants pv ON l.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      LEFT JOIN managers m ON l.manager_id = m.id
      ${whereClause}
      ORDER BY l.id DESC
      LIMIT ?
    `;

    const [rows] = await pool.query(sql, [...params, limit]);
    return rows;
  }

  /**
   * Query audit logs
   */
  static async getAuditLogs({ limit = 30, entityId = null, entityType = 'product' } = {}) {
    let whereClause = 'WHERE entity_type = ?';
    const params = [entityType];

    if (entityId) {
      whereClause += ' AND entity_id = ?';
      params.push(entityId);
    }

    const sql = `
      SELECT *
      FROM audit_logs
      ${whereClause}
      ORDER BY id DESC
      LIMIT ?
    `;
    const [rows] = await pool.query(sql, [...params, limit]);
    return rows;
  }
}

module.exports = LogRepository;
