const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Manager Dashboard View Routes
router.get('/products', productController.renderManagerPage);
router.get('/', (req, res) => res.redirect('/manager/products'));

module.exports = router;
