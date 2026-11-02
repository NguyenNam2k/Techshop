const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const reviewController = require('../controllers/review.controller');

router.get('/categories', productController.getCategories);
router.post('/reverse-image-search', productController.reverseImageSearch);
router.get('/reverse-image-search', productController.reverseImageSearch);
router.get('/:id/variants', productController.getProductVariants);
router.get('/:id/similar', productController.getSimilarProducts);
router.get('/:id/reviews', reviewController.getProductReviews);
router.post('/:id/reviews', reviewController.createProductReview);
router.post('/:id/reviews/:reviewId/like', reviewController.likeProductReview);
router.get('/:id', productController.getProductDetail);
router.get('/', productController.getProducts);

module.exports = router;
