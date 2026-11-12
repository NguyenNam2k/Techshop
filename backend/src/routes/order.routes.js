const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { verifyToken, requireRole, optionalAuth } = require('../../middleware/authMiddleware');

router.get('/', verifyToken, requireRole('customer'), orderController.getOrdersList);
router.post('/', optionalAuth, orderController.createOrder);
router.get('/:orderCode', optionalAuth, orderController.getOrderDetail);
router.post('/:orderCode/cancel', verifyToken, requireRole('customer'), orderController.cancelOrder);

module.exports = router;
