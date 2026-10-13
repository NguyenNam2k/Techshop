const { pool } = require('../config/database');
const BaseRepository = require('./baseRepository');

/**
 * Coupon Repository
 * Handles direct database CRUD access for coupons table
 */
class CouponRepository extends BaseRepository {
  /**
   * Find all coupons with optional filters
   */
  static async findAll({ search = '', is_active = 'all', limit = 50 } = {}) {
    let query = `
      SELECT * FROM coupons
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (code LIKE ? OR description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (is_active !== 'all') {
      query += ` AND is_active = ?`;
      params.push(is_active === '1' || is_active === true ? 1 : 0);
    }

    query += ` ORDER BY id DESC LIMIT ?`;
    params.push(parseInt(limit, 10) || 50);

    const [rows] = await pool.query(query, params);
    return rows;
  }

  /**
   * Find coupon by ID
   */
  static async findById(id) {
    const [rows] = await pool.query(`SELECT * FROM coupons WHERE id = ? LIMIT 1`, [id]);
    return rows[0] || null;
  }

  /**
   * Find coupon by unique code
   */
  static async findByCode(code) {
    const [rows] = await pool.query(`SELECT * FROM coupons WHERE code = ? LIMIT 1`, [code]);
    return rows[0] || null;
  }

  /**
   * Create new coupon
   */
  static async create(couponData) {
    const {
      code,
      description,
      discount_type,
      discount_value,
      min_order_value = 0,
      max_discount_amount = null,
      usage_limit = 100,
      start_date,
      end_date,
      is_active = 1
    } = couponData;

    const [result] = await pool.query(
      `INSERT INTO coupons (
        code, description, discount_type, discount_value, min_order_value, 
        max_discount_amount, usage_limit, used_count, start_date, end_date, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
      [
        code.toUpperCase().trim(),
        description || null,
        discount_type || 'percentage',
        parseFloat(discount_value),
        parseFloat(min_order_value) || 0,
        max_discount_amount ? parseFloat(max_discount_amount) : null,
        parseInt(usage_limit, 10) || 100,
        start_date,
        end_date,
        is_active ? 1 : 0
      ]
    );

    return result.insertId;
  }

  /**
   * Update existing coupon
   */
  static async update(id, couponData) {
    const {
      code,
      description,
      discount_type,
      discount_value,
      min_order_value,
      max_discount_amount,
      usage_limit,
      start_date,
      end_date,
      is_active
    } = couponData;

    const [result] = await pool.query(
      `UPDATE coupons SET
        code = COALESCE(?, code),
        description = COALESCE(?, description),
        discount_type = COALESCE(?, discount_type),
        discount_value = COALESCE(?, discount_value),
        min_order_value = COALESCE(?, min_order_value),
        max_discount_amount = ?,
        usage_limit = COALESCE(?, usage_limit),
        start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date),
        is_active = COALESCE(?, is_active),
        updated_at = NOW()
      WHERE id = ?`,
      [
        code ? code.toUpperCase().trim() : null,
        description !== undefined ? description : null,
        discount_type || null,
        discount_value !== undefined ? parseFloat(discount_value) : null,
        min_order_value !== undefined ? parseFloat(min_order_value) : null,
        max_discount_amount !== undefined ? (max_discount_amount ? parseFloat(max_discount_amount) : null) : null,
        usage_limit !== undefined ? parseInt(usage_limit, 10) : null,
        start_date || null,
        end_date || null,
        is_active !== undefined ? (is_active ? 1 : 0) : null,
        id
      ]
    );

    return result.affectedRows > 0;
  }

  /**
   * Toggle active state
   */
  static async toggleStatus(id) {
    const [result] = await pool.query(
      `UPDATE coupons SET is_active = IF(is_active = 1, 0, 1), updated_at = NOW() WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }

  /**
   * Delete coupon
   */
  static async delete(id) {
    const [result] = await pool.query(`DELETE FROM coupons WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }

  /**
   * Count total coupons and active count
   */
  static async getStats() {
    const [rows] = await pool.query(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN is_active = 1 AND end_date >= CURDATE() THEN 1 ELSE 0 END) AS active_count,
        SUM(used_count) AS total_redeemed
      FROM coupons
    `);
    return rows[0];
  }
}

module.exports = CouponRepository;
