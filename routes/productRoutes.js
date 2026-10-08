const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');

/**
 * Product & Manager Catalog Routes
 * Route -> Controller -> Service -> Repository
 */

// 1. Manager Dashboard View Routes
router.get('/manager/products', ProductController.renderManagerPage);
router.get('/manager', (req, res) => res.redirect('/manager/products'));

// Backward compatibility redirects (admin -> manager)
router.get('/admin/products', (req, res) => res.redirect('/manager/products'));
router.get('/admin', (req, res) => res.redirect('/manager/products'));

// 2. Product Catalog API Routes
// GET /api/products - Danh sách thiết bị (phân trang, lọc danh mục, tìm kiếm, sắp xếp)
router.get('/api/products', ProductController.getProductsJson);

// GET /api/products/stats - Thống kê KPI tổng quan catalog
router.get('/api/products/stats', ProductController.getCatalogStats);

// GET /api/products/:id - Lấy thông tin chi tiết thiết bị để điền vào form chỉnh sửa
router.get('/api/products/:id', ProductController.getProductJson);

// POST /api/products - Thêm mới thiết bị với 7 trường & tạo tồn kho ban đầu (TX 1)
router.post('/api/products', ProductController.createProduct);

// PUT /api/products/:id - Cập nhật thiết bị, đồng bộ giá biến thể & ghi audit log (TX 2)
router.put('/api/products/:id', ProductController.updateProduct);

// DELETE /api/products/:id - Xóa an toàn thiết bị với ràng buộc tồn kho = 0 (TX 3)
router.delete('/api/products/:id', ProductController.deleteProduct);

// POST /api/products/batch-stock - Khóa hàng & Cập nhật tồn kho hàng loạt (TX 4)
router.post('/api/products/batch-stock', ProductController.batchAdjustStock);

// Logs APIs
router.get('/api/logs/inventory', ProductController.getInventoryLogs);
router.get('/api/logs/audit', ProductController.getAuditLogs);

module.exports = router;
