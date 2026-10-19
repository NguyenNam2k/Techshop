const { pool } = require('../../config/database');
const BaseRepository = require('../baseRepository');

/**
 * Report Repository
 * Handles aggregation queries for Manager monthly & business reports
 */
class ReportRepository extends BaseRepository {
  /**
   * Get overall monthly summary
   */
  static async getMonthlySummary(year, month) {
    const [summaryRows] = await pool.query(
      `SELECT 
        COUNT(*) AS total_orders,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' AND shipping_status != 'cancelled' THEN final_amount ELSE 0 END), 0) AS total_revenue,
        COALESCE(AVG(CASE WHEN payment_status = 'paid' AND shipping_status != 'cancelled' THEN final_amount ELSE NULL END), 0) AS avg_order_value,
        SUM(CASE WHEN shipping_status = 'delivered' THEN 1 ELSE 0 END) AS delivered_orders,
        SUM(CASE WHEN shipping_status = 'shipping' THEN 1 ELSE 0 END) AS shipping_orders,
        SUM(CASE WHEN shipping_status IN ('processing', 'pending') THEN 1 ELSE 0 END) AS pending_orders,
        SUM(CASE WHEN shipping_status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_orders
      FROM orders
      WHERE YEAR(created_at) = ? AND MONTH(created_at) = ?`,
      [year, month]
    );

    return summaryRows[0] || {
      total_orders: 0,
      total_revenue: 0,
      avg_order_value: 0,
      delivered_orders: 0,
      shipping_orders: 0,
      pending_orders: 0,
      cancelled_orders: 0
    };
  }

  /**
   * Get top selling products in specified month
   */
  static async getTopSellingProducts(year, month, limit = 5) {
    const [rows] = await pool.query(
      `SELECT 
        oi.product_name,
        oi.sku,
        SUM(oi.quantity) AS total_sold,
        SUM(oi.subtotal) AS total_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE YEAR(o.created_at) = ? AND MONTH(o.created_at) = ? AND o.shipping_status != 'cancelled'
      GROUP BY oi.product_name, oi.sku
      ORDER BY total_sold DESC
      LIMIT ?`,
      [year, month, parseInt(limit, 10) || 5]
    );
    return rows;
  }

  /**
   * Get daily revenue trend for chart
   */
  static async getDailyRevenueTrend(year, month) {
    const [rows] = await pool.query(
      `SELECT 
        DATE_FORMAT(created_at, '%Y-%m-%d') AS date,
        DAY(created_at) AS day,
        COUNT(*) AS orders_count,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' AND shipping_status != 'cancelled' THEN final_amount ELSE 0 END), 0) AS revenue
      FROM orders
      WHERE YEAR(created_at) = ? AND MONTH(created_at) = ?
      GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d'), DAY(created_at)
      ORDER BY date ASC`,
      [year, month]
    );
    return rows;
  }

  /**
   * Get category sales distribution
   */
  static async getCategorySales(year, month) {
    const [rows] = await pool.query(
      `SELECT 
        COALESCE(c.name, 'Linh kiện & Khác') AS category_name,
        COUNT(oi.id) AS items_sold,
        COALESCE(SUM(oi.subtotal), 0) AS category_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      LEFT JOIN products p ON oi.product_name LIKE CONCAT('%', p.name, '%')
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE YEAR(o.created_at) = ? AND MONTH(o.created_at) = ? AND o.shipping_status != 'cancelled'
      GROUP BY COALESCE(c.name, 'Linh kiện & Khác')
      ORDER BY category_revenue DESC`,
      [year, month]
    );
    return rows;
  }
}

module.exports = ReportRepository;
