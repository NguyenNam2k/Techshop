const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');

router.get('/', orderController.getOrdersList);
router.post('/', orderController.createOrder);
router.post('/:orderCode/cancel-unpaid', orderController.cancelUnpaidOrder);
router.delete('/:orderCode/cancel-unpaid', orderController.cancelUnpaidOrder);
router.post('/:orderCode/cancel-request', orderController.requestCancellation);
router.post('/:orderCode/return-request', orderController.requestReturn);
router.patch('/:orderCode/status', orderController.updateStatus);
router.post('/:orderCode/customer-decision', orderController.confirmCustomerDecision);
router.get('/:orderCode', orderController.getOrderDetail);

module.exports = router;
