const express = require('express');
const router = express.Router();
const CouponController = require('../../controllers/manager/couponController');

/**
 * Coupon Management API Routes
 * Base path: /api/coupons
 */

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
