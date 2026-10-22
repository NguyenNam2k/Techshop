const path = require('path');
const fs = require('fs');
const ProductService = require('../../services/manager/productService');

/**
 * Product Controller
 * Handles Request/Response, validations, and coordinates Service layer for:
 * 1. Customer Product Details Page (PDP)
 * 2. Manager Product & Inventory Portal (MNG-01 & MNG-03)
 */
class ProductController {
  /**
   * Helper: check if incoming request expects JSON
   */
  static isApiRequest(req) {
    return (
      req.xhr ||
      req.headers.accept?.includes('application/json') ||
      req.path.startsWith('/api') ||
      req.query.format === 'json'
    );
  }

  /**
   * GET /manager/products (and legacy /admin/products)
   * Serves the Manager React JSX Single Page Application (SPA)
   */
  static renderManagerPage(req, res, next) {
    try {
      const reactAppDist = path.join(__dirname, '..', '..', '..', 'views', 'manager-app', 'dist', 'index.html');

      if (fs.existsSync(reactAppDist)) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        return res.sendFile(reactAppDist);
      }

      const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${FRONTEND_URL}/manager/products`);
    } catch (error) {
      next(error);
    }
  }

  // Alias for backward compatibility
  static renderAdminPage(req, res, next) {
    return ProductController.renderManagerPage(req, res, next);
  }

  /**
   * GET /api/products
   * Returns paginated products in JSON for dynamic AJAX data table refresh
   */
  static async getProductsJson(req, res, next) {
    try {
      const { page, limit, category_id, search, status, stock_status, sort } = req.query;

      const result = await ProductService.getProducts({
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 10,
        category_id: category_id || null,
        search: search || '',
        status: status || '',
        stock_status: stock_status || '',
        sort: sort || 'newest'
      });

      return res.status(200).json({
        success: true,
        data: result.products,
        pagination: result.pagination
      });
    } catch (error) {
      if (typeof next === 'function') next(error);
      else res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * GET /api/products/:id
   * Get single product details for populating the Edit Form or Customer PDP
   */
  static async getProductJson(req, res, next) {
    try {
      const id = req.params.id || req.query.id || req.query.slug;
      const product = await ProductService.getProductById(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy thiết bị với ID: ${id}`
        });
      }

      return res.status(200).json({
        success: true,
        data: product
      });
    } catch (error) {
      if (typeof next === 'function') next(error);
      else res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * GET /api/products/stats
   * Returns KPI summary metrics
   */
  static async getCatalogStats(req, res, next) {
    try {
      const stats = await ProductService.getCatalogStats();
      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      if (typeof next === 'function') next(error);
      else res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * POST /api/products
   * TRANSACTION 1: Create Product with Initial Inventory
   */
  static async createProduct(req, res, next) {
    try {
      const {
        name,
        category_id,
        brand,
        base_price,
        initial_stock,
        sku_code,
        description,
        thumbnail_url,
        images
      } = req.body;

      const errors = [];
      if (!name || !name.trim()) errors.push('Tên thiết bị không được để trống.');
      if (!category_id) errors.push('Vui lòng chọn danh mục thiết bị.');
      if (!brand || !brand.trim()) errors.push('Thương hiệu sản xuất không được để trống.');

      const price = parseFloat(base_price);
      if (isNaN(price) || price < 0) errors.push('Giá niêm yết cơ sở phải là số >= 0.');

      const stock = parseInt(initial_stock, 10);
      if (isNaN(stock) || stock < 0) errors.push('Số lượng nhập kho ban đầu phải là số nguyên >= 0.');

      if (!sku_code || !sku_code.trim()) errors.push('Mã SKU quản lý kho không được để trống.');

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: errors.join(' ')
        });
      }

      const result = await ProductService.createProduct({
        name: name.trim(),
        category_id: parseInt(category_id, 10),
        brand: brand.trim(),
        base_price: price,
        initial_stock: stock,
        sku_code: sku_code.trim(),
        description: description ? description.trim() : '',
        thumbnail_url: thumbnail_url ? thumbnail_url.trim() : null,
        images: Array.isArray(images) ? images : [],
        manager_id: req.body.manager_id || null
      });

      return res.status(201).json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      if (typeof next === 'function') next(error);
      else res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * PUT /api/products/:id
   * TRANSACTION 2: Update Product & Sync Variant Price
   */
  static async updateProduct(req, res, next) {
    try {
      const { id } = req.params;
      const {
        name,
        category_id,
        brand,
        base_price,
        sku_code,
        description,
        thumbnail_url
      } = req.body;

      const errors = [];
      if (!name || !name.trim()) errors.push('Tên thiết bị không được để trống.');
      if (!category_id) errors.push('Vui lòng chọn danh mục thiết bị.');
      if (!brand || !brand.trim()) errors.push('Thương hiệu sản xuất không được để trống.');

      const price = parseFloat(base_price);
      if (isNaN(price) || price < 0) errors.push('Giá niêm yết cơ sở phải là số >= 0.');

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: errors.join(' ')
        });
      }

      const result = await ProductService.updateProduct(id, {
        name: name.trim(),
        category_id: parseInt(category_id, 10),
        brand: brand.trim(),
        base_price: price,
        sku_code: sku_code ? sku_code.trim() : null,
        description: description ? description.trim() : '',
        thumbnail_url: thumbnail_url !== undefined ? thumbnail_url : null,
        changed_by: req.body.changed_by || 'Manager'
      });

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      if (typeof next === 'function') next(error);
      else res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * DELETE /api/products/:id
   * TRANSACTION 3: Safe Delete/Archive Product (Stock Guard Rule)
   */
  static async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;
      const result = await ProductService.deleteProduct(id);

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (error) {
      if (error.statusCode === 400 || error.totalStock > 0) {
        return res.status(400).json({
          success: false,
          message: error.message,
          totalStock: error.totalStock
        });
      }
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      if (typeof next === 'function') next(error);
      else res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * POST /api/products/batch-stock
   * TRANSACTION 4: Batch Adjust Stock / Restock
   */
  static async batchAdjustStock(req, res, next) {
    try {
      const { items, staff_id, manager_id } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu điều chỉnh hàng loạt phải là mảng các mục (items) không rỗng.'
        });
      }

      const result = await ProductService.batchAdjustStock(items, {
        staff_id,
        manager_id
      });

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      if (typeof next === 'function') next(error);
      else res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * GET /api/logs/inventory
   */
  static async getInventoryLogs(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 30;
      const productId = req.query.product_id ? parseInt(req.query.product_id, 10) : null;
      const variantId = req.query.variant_id ? parseInt(req.query.variant_id, 10) : null;

      const logs = await ProductService.getInventoryLogs({ limit, productId, variantId });

      return res.status(200).json({
        success: true,
        data: logs
      });
    } catch (error) {
      if (typeof next === 'function') next(error);
      else res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * GET /api/logs/audit
   */
  static async getAuditLogs(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 30;
      const entityId = req.query.entity_id ? parseInt(req.query.entity_id, 10) : null;

      const logs = await ProductService.getAuditLogs({ limit, entityId });

      return res.status(200).json({
        success: true,
        data: logs
      });
    } catch (error) {
      if (typeof next === 'function') next(error);
      else res.status(500).json({ success: false, message: error.message });
    }
  }

  // =========================================================================
  // CUSTOMER PDP CONTROLLERS
  // =========================================================================

  static async getProductDetail(req, res, next) {
    return ProductController.getProductJson(req, res, next);
  }

  static async getProductVariants(req, res, next) {
    try {
      const { id } = req.params;
      const variantsData = await ProductService.getProductVariantsById(id);

      if (!variantsData) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      res.status(200).json({
        success: true,
        data: variantsData
      });
    } catch (error) {
      console.error('Error in getProductVariants controller:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  static async getSimilarProducts(req, res, next) {
    try {
      const { id } = req.params;
      const { category_id, limit } = req.query;

      const similarProducts = await ProductService.getSimilarProducts(
        id,
        category_id ? parseInt(category_id, 10) : null,
        limit ? parseInt(limit, 10) : 4
      );

      res.status(200).json({
        success: true,
        data: similarProducts
      });
    } catch (error) {
      console.error('Error in getSimilarProducts controller:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * POST /api/products/upload-image
   * Handles image upload via Multer
   */
  static async uploadImage(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng chọn tệp hình ảnh để tải lên!'
        });
      }

      const imageUrl = `/uploads/products/${req.file.filename}`;
      return res.status(200).json({
        success: true,
        message: 'Tải hình ảnh lên thành công!',
        url: imageUrl,
        filename: req.file.filename,
        size: req.file.size
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products/:id/images
   */
  static async getProductImages(req, res, next) {
    try {
      const { id } = req.params;
      const images = await ProductService.getProductImages(id);
      return res.status(200).json({
        success: true,
        data: images
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/products/:id/images
   */
  static async addProductImage(req, res, next) {
    try {
      const { id } = req.params;
      const { image_url, angle_label, is_primary } = req.body;
      const result = await ProductService.addProductImage(id, {
        image_url,
        angle_label,
        is_primary
      });
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/products/:id/images/:imageId
   */
  static async deleteProductImage(req, res, next) {
    try {
      const { id, imageId } = req.params;
      const result = await ProductService.deleteProductImage(id, imageId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/products/:id/images/:imageId/primary
   */
  static async setPrimaryImage(req, res, next) {
    try {
      const { id, imageId } = req.params;
      const result = await ProductService.setPrimaryImage(id, imageId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

// Support both object and class invocations
ProductController.getProductDetail = ProductController.getProductDetail;
ProductController.getProductVariants = ProductController.getProductVariants;
ProductController.getSimilarProducts = ProductController.getSimilarProducts;

module.exports = ProductController;
