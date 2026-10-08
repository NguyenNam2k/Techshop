const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');

/**
 * Product & Admin Dashboard Routes
 */

// 1. Admin Dashboard View Route
router.get('/admin/products', ProductController.renderAdminPage);
router.get('/admin', (req, res) => res.redirect('/admin/products'));

// 2. Product Catalog API Routes
// GET /api/products - Danh sách thiết bị (phân trang, lọc danh mục, tìm kiếm, sắp xếp)
router.get('/api/products', ProductController.getProductsJson);

// GET /api/products/stats - Thống kê KPI tổng quan catalog
router.get('/api/products/stats', ProductController.getCatalogStats);

// GET /api/products/:id - Lấy thông tin chi tiết thiết bị để điền vào form chỉnh sửa
router.get('/api/products/:id', ProductController.getProductJson);

// POST /api/products - Transaction 1: Thêm mới thiết bị với 7 trường & tạo tồn kho ban đầu
router.post('/api/products', ProductController.createProduct);

// PUT /api/products/:id - Transaction 2: Cập nhật thiết bị, đồng bộ giá biến thể & ghi audit log
router.put('/api/products/:id', ProductController.updateProduct);

// DELETE /api/products/:id - Transaction 3: Safe Delete (kiểm tra tồn kho = 0 trước khi xóa)
router.delete('/api/products/:id', ProductController.deleteProduct);

// POST /api/products/batch-stock - Transaction 4: Khóa hàng & Cập nhật tồn kho hàng loạt
router.post('/api/products/batch-stock', ProductController.batchAdjustStock);

// Logs APIs
router.get('/api/logs/inventory', ProductController.getInventoryLogs);
router.get('/api/logs/audit', ProductController.getAuditLogs);

module.exports = router;
