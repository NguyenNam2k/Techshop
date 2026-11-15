const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../../middlewares/authMiddleware');
const adminRevenueController = require('../../controllers/admin/revenueController');

// Tất cả route doanh thu của Admin đều yêu cầu đăng nhập và có quyền 'admin'
router.use(verifyToken, requireRole('admin'));

// GET /api/admin/revenue/overview - Tổng quan doanh thu & biểu đồ phân tích
router.get('/overview', adminRevenueController.getRevenueOverview);

// GET /api/admin/revenue/export   - Xuất file CSV báo cáo doanh thu
router.get('/export', adminRevenueController.exportRevenueReport);

module.exports = router;
