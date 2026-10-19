const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Lấy danh sách biến thể của sản phẩm
router.get('/:id/variants', productController.getProductVariants);

// Lấy sản phẩm tương tự / cùng danh mục
router.get('/:id/similar', productController.getSimilarProducts);

// Lấy thông tin chi tiết sản phẩm theo ID hoặc Slug
router.get('/:id', productController.getProductDetail);
router.get('/', productController.getProductDetail);

module.exports = router;
