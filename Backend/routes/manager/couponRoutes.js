const express = require('express');
const router = express.Router();
const CouponController = require('../../controllers/manager/couponController');
const couponService = require('../../services/customer/couponService');
const pool = require('../../config/db');

/**
 * Coupon Management API Routes
 * Base path: /api/coupons
 */

// POST /api/coupons/validate - Kiểm tra mã giảm giá cho giỏ hàng
router.post('/validate', async (req, res) => {
  try {
    const { code, orderTotal } = req.body;
    const connection = await pool.getConnection();
    try {
      const result = await couponService.validateCoupon(connection, code, orderTotal);
      return res.status(200).json(result);
    } finally {
      connection.release();
    }
  } catch (err) {
    return res.status(500).json({ valid: false, message: err.message || 'Lỗi kiểm tra mã giảm giá' });
  }
});

// GET /api/coupons - Danh sách mã giảm giá
router.get('/', CouponController.getCoupons);

// GET /api/coupons/:id - Xem chi tiết mã
router.get('/:id', CouponController.getCoupon);

// POST /api/coupons - Tạo mã giảm giá mới
router.post('/', CouponController.createCoupon);

// PUT /api/coupons/:id - Cập nhật mã giảm giá
router.put('/:id', CouponController.updateCoupon);

// PATCH /api/coupons/:id/toggle - Kích hoạt / Tạm dừng mã
router.patch('/:id/toggle', CouponController.toggleStatus);

// DELETE /api/coupons/:id - Xóa mã giảm giá
router.delete('/:id', CouponController.deleteCoupon);

module.exports = router;
