const express = require('express');
const router = express.Router();
const customerController = require('../../controllers/customer/customerController');

router.get('/profile', customerController.getProfile);
router.put('/profile', customerController.updateProfile);
router.put('/change-password', customerController.changePassword);
router.put('/addresses', customerController.updateAddresses);
router.put('/payment-methods', customerController.updatePaymentMethods);
router.put('/wishlist', customerController.updateWishlist);
router.put('/pc-builds', customerController.updatePCBuilds);
router.post('/vouchers', customerController.saveVoucher);
router.post('/redeem-points', customerController.redeemPoints);
router.post('/tickets', customerController.createTicket);
router.post('/reviews', customerController.submitReview);

module.exports = router;
