const { pool } = require('../config/database');

/**
 * Category Model
 * Handles categories queries, pagination, and Transaction 5 (Cascade Reassignment)
 */
class CategoryModel {
  /**
   * Helper: slugify string for category URLs
   */
  static slugify(text) {
    return text
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove Vietnamese diacritics
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  /**
   * Get all categories for dropdown select and filter options
   * Includes count of products in each category
   */
  static async getAllCategories() {
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
   * Get categories with pagination and search
   * @param {Object} options - { page, limit, search }
   */
  static async getCategories({ page = 1, limit = 10, search = '' }) {
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

    // 1. Count total
    const countSql = `
      SELECT COUNT(c.id) AS total
      FROM categories c
      ${whereClause}
    `;
    const [countRows] = await pool.query(countSql, params);
    const total = countRows[0].total;
    const totalPages = Math.ceil(total / limitNum) || 1;

    // 2. Fetch rows
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
   * Find single category by ID
   */
  static async getCategoryById(id) {
    const [rows] = await pool.query(
      `SELECT c.*, COUNT(p.id) AS product_count 
       FROM categories c 
       LEFT JOIN products p ON c.id = p.category_id 
       WHERE c.id = ? 
       GROUP BY c.id`,
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Create new category
   */
  static async createCategory({ name, slug, description, icon_url, parent_id }) {
    const cleanSlug = slug && slug.trim() !== '' ? this.slugify(slug) : this.slugify(name);
    const [result] = await pool.query(
      `INSERT INTO categories (name, slug, description, icon_url, parent_id)
       VALUES (?, ?, ?, ?, ?)`,
      [name.trim(), cleanSlug, description || null, icon_url || null, parent_id || null]
    );
    return { id: result.insertId, name, slug: cleanSlug };
  }

  /**
   * Update category
   */
  static async updateCategory(id, { name, slug, description, icon_url, parent_id }) {
    const cleanSlug = slug && slug.trim() !== '' ? this.slugify(slug) : this.slugify(name);
    await pool.query(
      `UPDATE categories 
       SET name = ?, slug = ?, description = ?, icon_url = ?, parent_id = ?
       WHERE id = ?`,
      [name.trim(), cleanSlug, description || null, icon_url || null, parent_id || null, id]
    );
    return this.getCategoryById(id);
  }

  /**
   * =========================================================================
   * TRANSACTION 5: Category Delete with Cascade Reassignment
   * =========================================================================
   * - Xóa một danh mục khỏi bảng `categories`.
   * - Trước khi xóa, tự động cập nhật toàn bộ sản phẩm đang thuộc danh mục đó về
   *   danh mục mặc định "Uncategorized" (hoặc `category_id = 1`).
   * - Đảm bảo tính toàn vẹn dữ liệu khóa ngoại, nếu xảy ra lỗi ở bất kỳ bước nào
   *   thì hoàn tác toàn bộ (ROLLBACK).
   *
   * @param {number|string} categoryId - ID của danh mục cần xóa
   * @param {number|string} targetDefaultCategoryId - ID danh mục chuyển giao (mặc định = 1)
   */
  static async deleteCategoryWithCascadeReassignment(categoryId, targetDefaultCategoryId = 1) {
    const catId = parseInt(categoryId, 10);
    const defaultCatId = parseInt(targetDefaultCategoryId, 10) || 1;

    if (catId === defaultCatId) {
      const error = new Error(`Không thể xóa danh mục mặc định hệ thống (ID: ${defaultCatId})!`);
      error.statusCode = 400;
      throw error;
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // 1. Kiểm tra danh mục cần xóa có tồn tại hay không và khóa dòng
      const [categoryRows] = await connection.query(
        `SELECT id, name FROM categories WHERE id = ? FOR UPDATE`,
        [catId]
      );

      if (categoryRows.length === 0) {
        const error = new Error(`Danh mục với ID ${catId} không tồn tại.`);
        error.statusCode = 404;
        throw error;
      }
      const categoryToDelete = categoryRows[0];

      // 2. Đảm bảo danh mục đích "Uncategorized" tồn tại, nếu chưa có thì tạo mới bên trong Transaction
      const [defaultCatRows] = await connection.query(
        `SELECT id, name FROM categories WHERE id = ? FOR UPDATE`,
        [defaultCatId]
      );

      if (defaultCatRows.length === 0) {
        await connection.query(
          `INSERT INTO categories (id, name, slug, description) 
           VALUES (?, 'Uncategorized', 'uncategorized', 'Danh mục mặc định hệ thống cho các sản phẩm chưa phân loại')
           ON DUPLICATE KEY UPDATE name = VALUES(name)`,
          [defaultCatId]
        );
      }

      // 3. Đếm số lượng sản phẩm sẽ được chuyển giao
      const [countProds] = await connection.query(
        `SELECT COUNT(*) AS total FROM products WHERE category_id = ?`,
        [catId]
      );
      const reassignedCount = countProds[0].total;

      // 4. Cập nhật chuyển giao toàn bộ sản phẩm sang danh mục mặc định
      if (reassignedCount > 0) {
        await connection.query(
          `UPDATE products SET category_id = ? WHERE category_id = ?`,
          [defaultCatId, catId]
        );
      }

      // 5. Cập nhật các danh mục con trỏ parent_id về NULL để tránh vi phạm foreign key
      await connection.query(
        `UPDATE categories SET parent_id = NULL WHERE parent_id = ?`,
        [catId]
      );

      // 6. Xóa danh mục mục tiêu
      await connection.query(
        `DELETE FROM categories WHERE id = ?`,
        [catId]
      );

      // 7. Commit Transaction thành công
      await connection.commit();

      return {
        success: true,
        deletedCategoryId: catId,
        deletedCategoryName: categoryToDelete.name,
        targetCategoryId: defaultCatId,
        reassignedProductsCount: reassignedCount,
        message: `Đã xóa danh mục "${categoryToDelete.name}" thành công và chuyển giao an toàn ${reassignedCount} thiết bị sang danh mục mặc định.`
      };
    } catch (error) {
      // Rollback hoàn tác toàn bộ nếu xảy ra lỗi
      await connection.rollback();
      throw error;
    } finally {
      // Giải phóng kết nối về Connection Pool
      connection.release();
    }
  }
}

module.exports = CategoryModel;
