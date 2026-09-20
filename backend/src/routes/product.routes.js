const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');


router.get('/:id/variants', productController.getProductVariants);

router.get('/:id/similar', productController.getSimilarProducts);

router.get('/:id', productController.getProductDetail);

module.exports = router;