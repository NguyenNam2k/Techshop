const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../../middlewares/authMiddleware');
const adminOrderController = require('../../controllers/admin/orderController');

// Tất cả route đơn hàng của Admin đều yêu cầu đăng nhập và có quyền 'admin'
router.use(verifyToken, requireRole('admin'));

// GET   /api/admin/orders              - Danh sách đơn hàng (tìm kiếm, lọc, phân trang)
router.get('/', adminOrderController.getOrders);

// GET   /api/admin/orders/:orderCode   - Xem chi tiết đơn hàng
router.get('/:orderCode', adminOrderController.getOrderDetail);

// PATCH /api/admin/orders/:orderCode/status - Cập nhật trạng thái đơn hàng (giao hàng, thanh toán)
router.patch('/:orderCode/status', adminOrderController.updateOrderStatus);

module.exports = router;
