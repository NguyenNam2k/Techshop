const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');

router.get('/categories', productController.getCategories);
router.get('/:id/variants', productController.getProductVariants);
router.get('/:id/similar', productController.getSimilarProducts);
router.get('/:id/reviews', productController.getProductReviews);
router.post('/:id/reviews', productController.createProductReview);
router.get('/:id', productController.getProductDetail);
router.get('/', productController.getProducts);

module.exports = router;