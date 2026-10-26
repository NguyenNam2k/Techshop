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
router.post(
  '/upload-image',
  (req, res, next) => {
    upload.single('image')(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'Dung lượng tệp quá lớn! Tối đa cho phép là 10MB.'
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message || 'Định dạng tệp không hợp lệ! Vui lòng chỉ tải lên ảnh (JPEG, PNG, WEBP, GIF, SVG).'
        });
      }
      next();
    });
  },
  productController.uploadImage
);
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
