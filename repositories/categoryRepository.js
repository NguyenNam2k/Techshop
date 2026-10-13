const { pool } = require('../config/database');
const BaseRepository = require('./baseRepository');

/**
 * Category Repository
 * Handles direct database access and queries for categories table.
 */
class CategoryRepository extends BaseRepository {
  /**
   * Get all categories with product counts
   */
  static async findAll() {
    const query = `
      SELECT 
        c.id, 
        c.name, 
        c.slug, 
        c.description, 
        c.icon_url, 
        c.parent_id,
        p_parent.name AS parent_name,
        COUNT(p.id) AS product_count,
        c.created_at
      FROM categories c
      LEFT JOIN categories p_parent ON c.parent_id = p_parent.id
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id
      ORDER BY c.id ASC
    `;
    const [rows] = await pool.query(query);
    return rows;
  }

  /**
   * Get paginated categories with search filter
   */
  static async findPaginated({ page = 1, limit = 10, search = '' }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search && search.trim() !== '') {
      whereClause += ' AND (c.name LIKE ? OR c.slug LIKE ? OR c.description LIKE ?)';
      const keyword = `%${search.trim()}%`;
      params.push(keyword, keyword, keyword);
    }

    const countSql = `
      SELECT COUNT(c.id) AS total
      FROM categories c
      ${whereClause}
    `;
    const [countRows] = await pool.query(countSql, params);
    const total = countRows[0].total;
    const totalPages = Math.ceil(total / limitNum) || 1;

    const dataSql = `
      SELECT 
        c.id, 
        c.name, 
        c.slug, 
        c.description, 
        c.icon_url, 
        c.parent_id,
        parent.name AS parent_name,
        COUNT(p.id) AS product_count,
        c.created_at,
        c.updated_at
      FROM categories c
      LEFT JOIN categories parent ON c.parent_id = parent.id
      LEFT JOIN products p ON c.id = p.category_id
      ${whereClause}
      GROUP BY c.id
      ORDER BY c.id ASC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(dataSql, [...params, limitNum, offset]);

    return {
      categories: rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    };
  }

  /**
   * Find single category by ID (supports transaction connection & FOR UPDATE locking)
   */
  static async findById(id, connection = null, options = {}) {
    const executor = connection || pool;
    const forUpdateClause = options.forUpdate ? ' FOR UPDATE' : '';
    const query = `
      SELECT c.*, COUNT(p.id) AS product_count 
      FROM categories c 
      LEFT JOIN products p ON c.id = p.category_id 
      WHERE c.id = ? 
      GROUP BY c.id${forUpdateClause}
    `;
    const [rows] = await executor.query(query, [id]);
    return rows[0] || null;
  }

  /**
   * Insert new category
   */
  static async insert({ name, slug, description, icon_url, parent_id }, connection = null) {
    const executor = connection || pool;
    const [result] = await executor.query(
      `INSERT INTO categories (name, slug, description, icon_url, parent_id)
       VALUES (?, ?, ?, ?, ?)`,
      [name, slug, description || null, icon_url || null, parent_id || null]
    );
    return { id: result.insertId, name, slug };
  }

  /**
   * Update category
   */
  static async update(id, { name, slug, description, icon_url, parent_id }, connection = null) {
    const executor = connection || pool;
    await executor.query(
      `UPDATE categories 
       SET name = ?, slug = ?, description = ?, icon_url = ?, parent_id = ?
       WHERE id = ?`,
      [name, slug, description || null, icon_url || null, parent_id || null, id]
    );
    return this.findById(id, connection);
  }

  /**
   * Count total products belonging to a category
   */
  static async countProducts(categoryId, connection = null) {
    const executor = connection || pool;
    const [rows] = await executor.query(
      `SELECT COUNT(*) AS total FROM products WHERE category_id = ?`,
      [categoryId]
    );
    return rows[0] ? Number(rows[0].total) : 0;
  }

  /**
   * Reassign all products from one category to another
   */
  static async reassignProducts(fromCategoryId, toCategoryId, connection = null) {
    const executor = connection || pool;
    const [result] = await executor.query(
      `UPDATE products SET category_id = ? WHERE category_id = ?`,
      [toCategoryId, fromCategoryId]
    );
    return result.affectedRows;
  }

  /**
   * Reset parent_id to NULL for any child categories
   */
  static async clearParentForSubcategories(categoryId, connection = null) {
    const executor = connection || pool;
    const [result] = await executor.query(
      `UPDATE categories SET parent_id = NULL WHERE parent_id = ?`,
      [categoryId]
    );
    return result.affectedRows;
  }

  /**
   * Delete category by ID
   */
  static async delete(id, connection = null) {
    const executor = connection || pool;
    const [result] = await executor.query(
      `DELETE FROM categories WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }

  /**
   * Ensure default category (e.g. ID: 1 "Uncategorized") exists
   */
  static async ensureDefaultCategory(defaultId = 1, connection = null) {
    const executor = connection || pool;
    const [rows] = await executor.query(
      `SELECT id, name FROM categories WHERE id = ?`,
      [defaultId]
    );
    if (rows.length === 0) {
      await executor.query(
        `INSERT INTO categories (id, name, slug, description) 
         VALUES (?, 'Uncategorized', 'uncategorized', 'Danh mục mặc định hệ thống cho các sản phẩm chưa phân loại')
         ON DUPLICATE KEY UPDATE name = VALUES(name)`,
        [defaultId]
      );
    }
  }
}

module.exports = CategoryRepository;
