const ProductService = require('../services/productService');
const CategoryService = require('../services/categoryService');

/**
 * Product Controller
 * Handles Request/Response, validations, and coordinates Service layer for Manager Catalog.
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
   * Renders the complete Manager Product & Category Management Dashboard UI
   */
  static async renderManagerPage(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const category_id = req.query.category_id || 'all';
      const search = req.query.search || '';
      const status = req.query.status || 'all';
      const stock_status = req.query.stock_status || 'all';
      const sort = req.query.sort || 'newest';

      // 1. Fetch paginated products via Service
      const productResult = await ProductService.getProducts({
        page,
        limit,
        category_id,
        search,
        status,
        stock_status,
        sort
      });

      // 2. Fetch all categories for filter and dropdown via Service
      const categories = await CategoryService.getAllCategories();

      // 3. Fetch KPI stats via Service
      const stats = await ProductService.getCatalogStats();

      // 4. Render EJS view for Manager
      return res.render('manager/products', {
        title: 'Quản lý Thiết Bị Công Nghệ - Manager Portal | TechShop',
        products: productResult.products,
        pagination: productResult.pagination,
        categories,
        stats,
        filters: {
          page,
          limit,
          category_id,
          search,
          status,
          stock_status,
          sort
        },
        flashMessage: req.query.msg || null,
        flashType: req.query.msgType || 'success'
      });
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
      next(error);
    }
  }

  /**
   * GET /api/products/:id
   * Get single product details for populating the Edit Form
   */
  static async getProductJson(req, res, next) {
    try {
      const { id } = req.params;
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
      next(error);
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
      next(error);
    }
  }

  /**
   * POST /api/products
   * TRANSACTION 1: Create Product with Initial Inventory
   * Validates the exact 7 required fields
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
        description
      } = req.body;

      // 7 Required Fields Validation
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

      // Execute via ProductService
      const result = await ProductService.createProduct({
        name: name.trim(),
        category_id: parseInt(category_id, 10),
        brand: brand.trim(),
        base_price: price,
        initial_stock: stock,
        sku_code: sku_code.trim(),
        description: description ? description.trim() : '',
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
      next(error);
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
        description
      } = req.body;

      // Validation
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

      // Execute via ProductService
      const result = await ProductService.updateProduct(id, {
        name: name.trim(),
        category_id: parseInt(category_id, 10),
        brand: brand.trim(),
        base_price: price,
        sku_code: sku_code ? sku_code.trim() : null,
        description: description ? description.trim() : '',
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
      next(error);
    }
  }

  /**
   * DELETE /api/products/:id
   * TRANSACTION 3: Safe Delete/Archive Product (Stock Guard Rule)
   */
  static async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;

      // Execute via ProductService
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
      next(error);
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
      next(error);
    }
  }

  /**
   * GET /api/logs/inventory
   * Retrieve catalog inventory logs
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
      next(error);
    }
  }

  /**
   * GET /api/logs/audit
   * Retrieve catalog audit logs
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
      next(error);
    }
  }
}

module.exports = ProductController;
