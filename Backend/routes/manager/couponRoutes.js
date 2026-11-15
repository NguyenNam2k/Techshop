const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const CouponController = require('../../controllers/manager/couponController');
const customerCouponController = require('../../controllers/customer/couponController');
const { optionalAuth } = require('../../middlewares/authMiddleware');

// Hỗ trợ cả Windows và Linux (khi phân tách thư mục Backend và backend)
let couponSrcController;
try {
  couponSrcController = require('../../src/controllers/coupon.controller');
} catch (err) {
  if (err.code === 'MODULE_NOT_FOUND') {
    couponSrcController = require('../../../backend/src/controllers/coupon.controller');
  } else {
    throw err;
  }
}

router.post('/validate', couponSrcController.validateCoupon);

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
