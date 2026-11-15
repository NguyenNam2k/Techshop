const express = require('express');
const router = express.Router();
const CouponController = require('../../controllers/manager/couponController');
const customerCouponController = require('../../controllers/customer/couponController');
const { optionalAuth } = require('../../middlewares/authMiddleware');

/**
 * Coupon Management & Customer Storefront API Routes
 * Base path: /api/coupons
 */

// Customer Storefront endpoints (placed before /:id to avoid route collision)
router.get('/active', optionalAuth, customerCouponController.getActiveCoupons);
router.post('/validate', optionalAuth, customerCouponController.validateCoupon);

// GET /api/coupons - Danh sách mã giảm giá (Manager)
router.get('/', CouponController.getCoupons);

// GET /api/coupons/:id - Xem chi tiết mã
router.get('/:id', CouponController.getCouponById);

// POST /api/coupons - Tạo mã giảm giá mới
router.post('/', CouponController.createCoupon);

// PUT /api/coupons/:id - Cập nhật mã giảm giá
router.put('/:id', CouponController.updateCoupon);

// DELETE /api/coupons/:id - Xóa mã giảm giá
router.delete('/:id', CouponController.deleteCoupon);

module.exports = router;
