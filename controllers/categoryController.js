const CategoryService = require('../services/categoryService');

/**
 * Category Controller
 * Handles HTTP requests, validations, and responses for Category management.
 * Delegates all business logic to CategoryService.
 */
class CategoryController {
  /**
   * GET /api/categories
   * Retrieve all categories (or paginated if query params supplied)
   */
  static async getCategories(req, res, next) {
    try {
      const { page, limit, search, all } = req.query;

      if (all === 'true' || all === '1') {
        const categories = await CategoryService.getAllCategories();
        return res.status(200).json({
          success: true,
          data: categories
        });
      }

      const result = await CategoryService.getCategories({
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 10,
        search: search || ''
      });

      return res.status(200).json({
        success: true,
        data: result.categories,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/categories/:id
   * Retrieve single category by ID
   */
  static async getCategory(req, res, next) {
    try {
      const { id } = req.params;
      const category = await CategoryService.getCategoryById(id);

      if (!category) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy danh mục với ID: ${id}`
        });
      }

      return res.status(200).json({
        success: true,
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/categories
   * Create new category
   */
  static async createCategory(req, res, next) {
    try {
      const { name, slug, description, icon_url, parent_id } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Tên danh mục không được để trống.'
        });
      }

      const result = await CategoryService.createCategory({
        name: name.trim(),
        slug,
        description,
        icon_url,
        parent_id: parent_id ? parseInt(parent_id, 10) : null
      });

      return res.status(201).json({
        success: true,
        message: 'Tạo danh mục mới thành công!',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/categories/:id
   * Update existing category
   */
  static async updateCategory(req, res, next) {
    try {
      const { id } = req.params;
      const { name, slug, description, icon_url, parent_id } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Tên danh mục không được để trống.'
        });
      }

      const updated = await CategoryService.updateCategory(id, {
        name: name.trim(),
        slug,
        description,
        icon_url,
        parent_id: parent_id ? parseInt(parent_id, 10) : null
      });

      return res.status(200).json({
        success: true,
        message: 'Cập nhật danh mục thành công!',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/categories/:id
   * TRANSACTION 5: Category Delete with Cascade Reassignment
   */
  static async deleteCategory(req, res, next) {
    try {
      const { id } = req.params;
      const { target_category_id } = req.body;

      const targetId = parseInt(target_category_id, 10) || 1;

      const result = await CategoryService.deleteCategoryWithCascadeReassignment(id, targetId);

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }
}

module.exports = CategoryController;
