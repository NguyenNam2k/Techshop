const CategoryRepository = require('../repositories/categoryRepository');
const BaseRepository = require('../repositories/baseRepository');

/**
 * Category Service
 * Handles business rules, validations, and transaction coordination for categories.
 */
class CategoryService {
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
   * Get all categories for dropdowns and filter selectors
   */
  static async getAllCategories() {
    return await CategoryRepository.findAll();
  }

  /**
   * Get paginated categories with search
   */
  static async getCategories({ page = 1, limit = 10, search = '' }) {
    return await CategoryRepository.findPaginated({ page, limit, search });
  }

  /**
   * Get single category by ID
   */
  static async getCategoryById(id) {
    const catId = parseInt(id, 10);
    if (!catId) throw new Error('ID danh mục không hợp lệ.');
    return await CategoryRepository.findById(catId);
  }

  /**
   * Create category
   */
  static async createCategory({ name, slug, description, icon_url, parent_id }) {
    if (!name || !name.trim()) {
      const err = new Error('Tên danh mục không được để trống.');
      err.statusCode = 400;
      throw err;
    }

    const cleanSlug = slug && slug.trim() !== '' ? this.slugify(slug) : this.slugify(name);
    return await CategoryRepository.insert({
      name: name.trim(),
      slug: cleanSlug,
      description: description ? description.trim() : null,
      icon_url: icon_url || null,
      parent_id: parent_id ? parseInt(parent_id, 10) : null
    });
  }

  /**
   * Update category
   */
  static async updateCategory(id, { name, slug, description, icon_url, parent_id }) {
    const catId = parseInt(id, 10);
    if (!catId) throw new Error('ID danh mục không hợp lệ.');

    if (!name || !name.trim()) {
      const err = new Error('Tên danh mục không được để trống.');
      err.statusCode = 400;
      throw err;
    }

    const existing = await CategoryRepository.findById(catId);
    if (!existing) {
      const err = new Error(`Không tìm thấy danh mục với ID: ${catId}`);
      err.statusCode = 404;
      throw err;
    }

    const cleanSlug = slug && slug.trim() !== '' ? this.slugify(slug) : this.slugify(name);
    return await CategoryRepository.update(catId, {
      name: name.trim(),
      slug: cleanSlug,
      description: description ? description.trim() : null,
      icon_url: icon_url || null,
      parent_id: parent_id ? parseInt(parent_id, 10) : null
    });
  }

  /**
   * =========================================================================
   * TRANSACTION 5: Category Delete with Cascade Reassignment
   * =========================================================================
   * Business Rules:
   * 1. Cannot delete system default category (ID: 1 "Uncategorized").
   * 2. Lock category for deletion with FOR UPDATE.
   * 3. Ensure target default category exists.
   * 4. Reassign all existing products from category to default category.
   * 5. Set parent_id of any subcategories to NULL.
   * 6. Delete category safely.
   */
  static async deleteCategoryWithCascadeReassignment(categoryId, targetDefaultCategoryId = 1) {
    const catId = parseInt(categoryId, 10);
    const defaultCatId = parseInt(targetDefaultCategoryId, 10) || 1;

    if (catId === defaultCatId) {
      const error = new Error(`Không thể xóa danh mục mặc định hệ thống (ID: ${defaultCatId})!`);
      error.statusCode = 400;
      throw error;
    }

    const connection = await BaseRepository.getConnection();

    try {
      await BaseRepository.beginTransaction(connection);

      // 1. Lock and verify category exists
      const categoryToDelete = await CategoryRepository.findById(catId, connection, { forUpdate: true });
      if (!categoryToDelete) {
        const error = new Error(`Danh mục với ID ${catId} không tồn tại.`);
        error.statusCode = 404;
        throw error;
      }

      // 2. Ensure default destination category exists
      await CategoryRepository.ensureDefaultCategory(defaultCatId, connection);

      // 3. Count products to reassign
      const reassignedCount = await CategoryRepository.countProducts(catId, connection);

      // 4. Reassign products
      if (reassignedCount > 0) {
        await CategoryRepository.reassignProducts(catId, defaultCatId, connection);
      }

      // 5. Clear parent reference in subcategories
      await CategoryRepository.clearParentForSubcategories(catId, connection);

      // 6. Delete category
      await CategoryRepository.delete(catId, connection);

      // 7. Commit transaction
      await BaseRepository.commit(connection);

      return {
        success: true,
        deletedCategoryId: catId,
        deletedCategoryName: categoryToDelete.name,
        targetCategoryId: defaultCatId,
        reassignedProductsCount: reassignedCount,
        message: `Đã xóa danh mục "${categoryToDelete.name}" thành công và chuyển giao an toàn ${reassignedCount} thiết bị sang danh mục mặc định.`
      };
    } catch (error) {
      await BaseRepository.rollback(connection);
      throw error;
    } finally {
      BaseRepository.releaseConnection(connection);
    }
  }
}

module.exports = CategoryService;
