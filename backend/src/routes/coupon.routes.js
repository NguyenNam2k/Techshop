const express = require('express');
const router = express.Router();
const couponController = require('../controllers/coupon.controller');

router.get('/', couponController.getActiveCoupons);
router.post('/validate', couponController.validateCoupon);

module.exports = router;
