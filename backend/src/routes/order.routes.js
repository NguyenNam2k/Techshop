const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');

router.get('/', orderController.getOrdersList);
router.post('/', orderController.createOrder);
router.get('/:orderCode', orderController.getOrderDetail);

module.exports = router;
