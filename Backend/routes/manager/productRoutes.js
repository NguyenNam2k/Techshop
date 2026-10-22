const express = require('express');
const router = express.Router();
const productController = require('../../controllers/manager/productController');
const upload = require('../../middlewares/uploadMiddleware');

/**
 * Product Routes (Base path: /api/products)
 * Coordinates both Customer Catalog/PDP and Manager CRUD
 */

// 1. KPI Stats & Batch Operations
router.get('/stats', productController.getCatalogStats);
router.post('/batch-stock', productController.batchAdjustStock);

// 2. Product List for Manager Data Table / AJAX (GET /api/products)
router.get('/', productController.getProductsJson);

// 3. Image Upload & Gallery Management
router.post('/upload-image', upload.single('image'), productController.uploadImage);
router.get('/:id/images', productController.getProductImages);
router.post('/:id/images', productController.addProductImage);
router.delete('/:id/images/:imageId', productController.deleteProductImage);
router.patch('/:id/images/:imageId/primary', productController.setPrimaryImage);

// 4. Customer PDP Sub-resources
router.get('/:id/variants', productController.getProductVariants);
router.get('/:id/similar', productController.getSimilarProducts);

// 5. Product Single Details & CRUD
router.get('/:id', productController.getProductDetail);
router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;
