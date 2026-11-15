const express = require('express');
const router = express.Router();
const paymentController = require('../../controllers/customer/paymentController');

router.post('/webhook', paymentController.bankWebhook);
router.post('/simulate', paymentController.simulatePayment);
router.get('/status/:orderCode', paymentController.getPaymentStatus);

module.exports = router;
