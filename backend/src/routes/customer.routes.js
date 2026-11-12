const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');

// Strictly isolate all /api/customer endpoints to authenticated customer accounts
router.use(verifyToken, requireRole('customer'));

router.get('/profile', customerController.getProfile);
router.put('/profile', customerController.updateProfile);
router.put('/change-password', customerController.changePassword);

// Wishlist endpoints synchronized with MySQL `wishlists` table
router.get('/wishlist', customerController.getWishlist);
router.post('/wishlist', customerController.addToWishlist);
router.post('/wishlist/toggle', customerController.toggleWishlist);
router.put('/wishlist', customerController.updateWishlist);
router.delete('/wishlist/:productId', customerController.removeFromWishlist);

// Customer Voucher Wallet endpoints synchronized with `customer_vouchers` & `coupons`
router.get('/vouchers', customerController.getVouchers);
router.post('/vouchers', customerController.saveVoucher);
router.delete('/vouchers/:couponId', customerController.removeSavedVoucher);

module.exports = router;
