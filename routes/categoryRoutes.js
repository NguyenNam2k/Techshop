const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/categoryController');

/**
 * Category Management API Routes
 */

// GET /api/categories - Lấy danh sách danh mục (hỗ trợ phân trang và ?all=true)
router.get('/', CategoryController.getCategories);

// GET /api/categories/:id - Lấy chi tiết 1 danh mục
router.get('/:id', CategoryController.getCategory);

// POST /api/categories - Tạo mới danh mục
router.post('/', CategoryController.createCategory);

// PUT /api/categories/:id - Cập nhật danh mục
router.put('/:id', CategoryController.updateCategory);

// DELETE /api/categories/:id - Xóa danh mục an toàn với Transaction 5 (Cascade Reassignment)
router.delete('/:id', CategoryController.deleteCategory);

module.exports = router;
