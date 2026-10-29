const express = require('express');
const router = express.Router();
const cartController = require('../../controllers/customer/cartController');

router.get('/', cartController.getCart);
router.put('/', cartController.syncCart);
router.post('/merge', cartController.mergeCart);
router.post('/items', cartController.addItem);
router.post('/add', cartController.addItem);
router.put('/items/:id', cartController.updateItem);
router.delete('/items/:id', cartController.removeItem);
router.delete('/clear', cartController.clearCart);
router.delete('/', cartController.clearCart);

module.exports = router;
