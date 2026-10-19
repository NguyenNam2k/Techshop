const ProductRepository = require('../repositories/productRepository');
const CategoryRepository = require('../repositories/categoryRepository');
const LogRepository = require('../repositories/logRepository');
const BaseRepository = require('../repositories/baseRepository');

/**
 * Product Service
 * Handles business logic, domain rules, and ACID transaction orchestrations
 * for Manager Catalog & Inventory Management.
 */
class ProductService {
  /**
   * Helper: Generate URL-safe slug
   */
  static slugify(text) {
    const baseSlug = text
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove Vietnamese diacritics
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    return baseSlug || 'product';
  }

  /**
   * Helper: Generate unique slug across products table
   */
  static async generateUniqueSlug(name, excludeProductId = null, connection = null) {
    const baseSlug = this.slugify(name);
    let candidate = baseSlug;
    let counter = 1;

    while (true) {
      const exists = await ProductRepository.checkSlugExists(candidate, excludeProductId, connection);
      if (!exists) return candidate;
      candidate = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  /**
   * Get paginated products with filtering and sorting
   */
  static async getProducts(filters = {}) {
    return await ProductRepository.findAll(filters);
  }

  /**
   * Get single product with full category and variant info
   */
  static async getProductById(id) {
    const prodId = parseInt(id, 10);
    if (!prodId) throw new Error('ID thiết bị không hợp lệ.');
    return await ProductRepository.findById(prodId);
  }

  /**
   * Get KPI statistics for Catalog overview
   */
  static async getCatalogStats() {
    return await ProductRepository.getCatalogStats();
  }

  /**
   * =========================================================================
   * TRANSACTION 1: Create Product with Initial Inventory
   * =========================================================================
   * Business Rules:
   * 1. 7 mandatory fields: name, category_id, brand, base_price, initial_stock, sku_code, description.
   * 2. Verify SKU is unique across product_variants.
   * 3. Verify category exists.
   * 4. Generate unique slug.
   * 5. Atomic insert: products -> product_variants (default variant) -> inventory_logs (INITIAL_IMPORT).
   */
  static async createProduct({
    name,
    category_id,
    brand,
    base_price,
    initial_stock,
    sku_code,
    description,
    manager_id = null
  }) {
    // 1. Validation logic
    if (!name || !name.trim()) throw new Error('Tên thiết bị không được để trống.');
    if (!category_id) throw new Error('Vui lòng chọn danh mục cho thiết bị.');
    if (!brand || !brand.trim()) throw new Error('Thương hiệu không được để trống.');
    const priceNum = parseFloat(base_price);
    if (isNaN(priceNum) || priceNum < 0) throw new Error('Giá niêm yết cơ sở phải là số >= 0.');
    const stockNum = parseInt(initial_stock, 10);
    if (isNaN(stockNum) || stockNum < 0) throw new Error('Số lượng tồn kho ban đầu phải là số nguyên >= 0.');
    if (!sku_code || !sku_code.trim()) throw new Error('Mã SKU quản lý kho không được để trống.');

    const cleanSku = sku_code.trim().toUpperCase();
    const cleanName = name.trim();
    const cleanBrand = brand.trim();
    const cleanDesc = description ? description.trim() : '';

    const connection = await BaseRepository.getConnection();

    try {
      await BaseRepository.beginTransaction(connection);

      // 1.1. Check duplicate SKU
      const skuExists = await ProductRepository.checkSkuExists(cleanSku, null, connection);
      if (skuExists) {
        const error = new Error(`Mã SKU "${cleanSku}" đã tồn tại trên hệ thống. Vui lòng nhập mã SKU khác.`);
        error.statusCode = 400;
        throw error;
      }

      // 1.2. Check category exists
      const category = await CategoryRepository.findById(category_id, connection);
      if (!category) {
        const error = new Error(`Danh mục (ID: ${category_id}) không tồn tại.`);
        error.statusCode = 400;
        throw error;
      }

      // 1.3. Generate unique slug
      const uniqueSlug = await this.generateUniqueSlug(cleanName, null, connection);

      // 1.4. Insert into products
      const productStatus = stockNum > 0 ? 'active' : 'out_of_stock';
      const productId = await ProductRepository.insertProduct({
        category_id,
        created_by_manager_id: manager_id,
        name: cleanName,
        slug: uniqueSlug,
        brand: cleanBrand,
        model_code: cleanSku,
        base_price: priceNum,
        description: cleanDesc,
        warranty_months: 12,
        status: productStatus
      }, connection);

      // 1.5. Insert into product_variants (default standard variant)
      const variantStatus = stockNum > 0 ? 'available' : 'out_of_stock';
      const variantId = await ProductRepository.insertVariant({
        product_id: productId,
        sku: cleanSku,
        color: 'Tiêu chuẩn',
        color_code: '#1E293B',
        spec_version: 'Bản tiêu chuẩn',
        price: priceNum,
        stock: stockNum,
        status: variantStatus
      }, connection);

      // 1.6. Insert initial inventory log
      await LogRepository.insertInventoryLog({
        variant_id: variantId,
        manager_id,
        change_type: 'import',
        quantity_changed: stockNum,
        stock_after: stockNum,
        note: 'Khởi tạo thiết bị và nhập kho ban đầu'
      }, connection);

      // 1.7. Commit transaction
      await BaseRepository.commit(connection);

      return {
        success: true,
        productId,
        variantId,
        sku: cleanSku,
        name: cleanName,
        stock: stockNum,
        price: priceNum,
        message: 'Khởi tạo thiết bị và biến thể tồn kho ban đầu thành công!'
      };
    } catch (error) {
      await BaseRepository.rollback(connection);
      throw error;
    } finally {
      BaseRepository.releaseConnection(connection);
    }
  }

  /**
   * =========================================================================
   * TRANSACTION 2: Update Product & Sync Variant Price
   * =========================================================================
   * Business Rules:
   * 1. Lock existing product row with FOR UPDATE.
   * 2. Lock default variant row with FOR UPDATE.
   * 3. If SKU changed, verify no duplicate SKU.
   * 4. If name changed, regenerate unique slug.
   * 5. Update product info.
   * 6. Sync base price to default variant.
   * 7. Record change history into audit_logs.
   */
  static async updateProduct(productId, {
    name,
    category_id,
    brand,
    base_price,
    sku_code,
    description,
    changed_by = 'Manager'
  }) {
    const prodId = parseInt(productId, 10);
    if (!prodId) throw new Error('ID thiết bị không hợp lệ.');

    if (!name || !name.trim()) throw new Error('Tên thiết bị không được để trống.');
    if (!category_id) throw new Error('Vui lòng chọn danh mục cho thiết bị.');
    if (!brand || !brand.trim()) throw new Error('Thương hiệu không được để trống.');
    const priceNum = parseFloat(base_price);
    if (isNaN(priceNum) || priceNum < 0) throw new Error('Giá niêm yết cơ sở phải là số >= 0.');

    const cleanName = name.trim();
    const cleanBrand = brand.trim();
    const cleanDesc = description ? description.trim() : '';
    const cleanSku = sku_code ? sku_code.trim().toUpperCase() : null;

    const connection = await BaseRepository.getConnection();

    try {
      await BaseRepository.beginTransaction(connection);

      // 2.1. Lock product row FOR UPDATE
      const oldProduct = await ProductRepository.findProductRawById(prodId, connection, { forUpdate: true });
      if (!oldProduct) {
        const error = new Error(`Thiết bị (ID: ${prodId}) không tồn tại.`);
        error.statusCode = 404;
        throw error;
      }

      // 2.2. Lock default variant FOR UPDATE
      const variants = await ProductRepository.findVariantsByProductId(prodId, connection, { forUpdate: true });
      const defaultVariant = variants[0] || null;

      // 2.3. Check SKU collision if SKU changed
      if (cleanSku && defaultVariant && cleanSku !== defaultVariant.sku) {
        const skuExists = await ProductRepository.checkSkuExists(cleanSku, defaultVariant.id, connection);
        if (skuExists) {
          const error = new Error(`Mã SKU "${cleanSku}" đã được sử dụng bởi biến thể khác.`);
          error.statusCode = 400;
          throw error;
        }
      }

      // 2.4. Update slug if name changed
      let newSlug = oldProduct.slug;
      if (cleanName !== oldProduct.name) {
        newSlug = await this.generateUniqueSlug(cleanName, prodId, connection);
      }

      // 2.5. Update product
      await ProductRepository.updateProduct(prodId, {
        name: cleanName,
        slug: newSlug,
        category_id,
        brand: cleanBrand,
        base_price: priceNum,
        description: cleanDesc,
        model_code: cleanSku
      }, connection);

      // 2.6. Sync price and SKU to default variant
      if (defaultVariant) {
        await ProductRepository.updateVariant(defaultVariant.id, {
          price: priceNum,
          sku: cleanSku
        }, connection);
      }

      // 2.7. Insert audit log
      const auditPayload = {
        name: cleanName,
        category_id,
        brand: cleanBrand,
        base_price: priceNum,
        sku: cleanSku,
        description: cleanDesc
      };

      await LogRepository.insertAuditLog({
        entity_type: 'product',
        entity_id: prodId,
        action: 'UPDATE_PRODUCT_SYNC_PRICE',
        old_data: oldProduct,
        new_data: auditPayload,
        changed_by
      }, connection);

      // 2.8. Commit transaction
      await BaseRepository.commit(connection);

      return {
        success: true,
        productId: prodId,
        syncedPrice: priceNum,
        message: 'Cập nhật thiết bị và đồng bộ giá biến thể thành công.'
      };
    } catch (error) {
      await BaseRepository.rollback(connection);
      throw error;
    } finally {
      BaseRepository.releaseConnection(connection);
    }
  }

  /**
   * =========================================================================
   * TRANSACTION 3: Safe Delete/Archive Product (Stock Guard Rule)
   * =========================================================================
   * Business Rules:
   * 1. Lock product and variants with FOR UPDATE.
   * 2. Calculate total inventory units across all variants.
   * 3. Stock Guard Constraint:
   *    - IF totalStock > 0: REJECT delete and ROLLBACK immediately.
   *    - IF totalStock === 0: Delete related foreign key entries, then delete product.
   */
  static async deleteProduct(productId) {
    const prodId = parseInt(productId, 10);
    if (!prodId) throw new Error('ID thiết bị không hợp lệ.');

    const connection = await BaseRepository.getConnection();

    try {
      await BaseRepository.beginTransaction(connection);

      // 3.1. Lock product row FOR UPDATE
      const product = await ProductRepository.findProductRawById(prodId, connection, { forUpdate: true });
      if (!product) {
        const error = new Error(`Thiết bị (ID: ${prodId}) không tồn tại.`);
        error.statusCode = 404;
        throw error;
      }

      // 3.2. Lock all variants FOR UPDATE & calculate stock
      const variants = await ProductRepository.findVariantsByProductId(prodId, connection, { forUpdate: true });
      const totalStock = variants.reduce((sum, v) => sum + Math.max(0, parseInt(v.stock, 10) || 0), 0);

      // STOCK GUARD: Reject if inventory exists
      if (totalStock > 0) {
        const error = new Error(
          `Không thể xóa: Thiết bị "${product.name}" hiện vẫn còn ${totalStock} sản phẩm tồn kho trong hệ thống. ` +
          `Vui lòng điều chỉnh hoặc xả kho về 0 trước khi xóa an toàn!`
        );
        error.statusCode = 400;
        error.totalStock = totalStock;
        await BaseRepository.rollback(connection);
        throw error;
      }

      // 3.3. Cleanup dependencies when total stock = 0
      const variantIds = variants.map(v => v.id);
      if (variantIds.length > 0) {
        await ProductRepository.cleanupVariantDependencies(variantIds, connection);
        await ProductRepository.deleteVariantsByProductId(prodId, connection);
      }

      await ProductRepository.cleanupProductDependencies(prodId, connection);
      await ProductRepository.deleteProduct(prodId, connection);

      // 3.4. Commit transaction
      await BaseRepository.commit(connection);

      return {
        success: true,
        deletedProductId: prodId,
        productName: product.name,
        message: `Đã xóa thiết bị "${product.name}" an toàn do tồn kho đã về 0.`
      };
    } catch (error) {
      await BaseRepository.rollback(connection);
      throw error;
    } finally {
      BaseRepository.releaseConnection(connection);
    }
  }

  /**
   * =========================================================================
   * TRANSACTION 4: Batch Adjust Stock / Restock
   * =========================================================================
   * Business Rules:
   * 1. Iterate through items, lock each variant with SELECT FOR UPDATE.
   * 2. Compute stock_after based on new_stock or quantity_change.
   * 3. Non-negative constraint: stock_after must be >= 0.
   * 4. Update variant stock and status.
   * 5. Sync parent product status ('active' / 'out_of_stock').
   * 6. Record change into inventory_logs.
   */
  static async batchAdjustStock(adjustments, operatorInfo = {}) {
    if (!Array.isArray(adjustments) || adjustments.length === 0) {
      throw new Error('Danh sách điều chỉnh tồn kho không được để trống.');
    }

    const connection = await BaseRepository.getConnection();

    try {
      await BaseRepository.beginTransaction(connection);

      const results = [];

      for (const item of adjustments) {
        const variantId = parseInt(item.variant_id || item.id, 10);
        if (!variantId) {
          throw new Error('Mỗi mục điều chỉnh phải có variant_id hợp lệ.');
        }

        // 4.1. Lock variant row FOR UPDATE
        const variant = await ProductRepository.findVariantById(variantId, connection, { forUpdate: true });
        if (!variant) {
          const error = new Error(`Biến thể (ID: ${variantId}) không tồn tại.`);
          error.statusCode = 404;
          throw error;
        }

        const currentStock = parseInt(variant.stock, 10);
        let stockAfter;
        let quantityChanged;

        // 4.2. Compute new stock
        if (item.new_stock !== undefined && item.new_stock !== null && item.new_stock !== '') {
          stockAfter = parseInt(item.new_stock, 10);
          if (isNaN(stockAfter) || stockAfter < 0) {
            throw new Error(`Số lượng tồn kho mới phải >= 0 cho SKU: ${variant.sku}`);
          }
          quantityChanged = stockAfter - currentStock;
        } else if (item.quantity_change !== undefined && item.quantity_change !== null) {
          quantityChanged = parseInt(item.quantity_change, 10);
          if (isNaN(quantityChanged)) {
            throw new Error(`Số lượng thay đổi không hợp lệ cho SKU: ${variant.sku}`);
          }
          stockAfter = currentStock + quantityChanged;
          if (stockAfter < 0) {
            throw new Error(
              `Không thể trừ quá số tồn kho hiện tại (Hiện có: ${currentStock}, yêu cầu trừ: ${Math.abs(quantityChanged)}) cho SKU: ${variant.sku}`
            );
          }
        } else {
          throw new Error(`Mỗi mục cần có 'new_stock' hoặc 'quantity_change' để điều chỉnh.`);
        }

        // 4.3. Update variant stock and status
        const newVariantStatus = stockAfter > 0 ? 'available' : 'out_of_stock';
        await ProductRepository.updateVariant(variantId, {
          stock: stockAfter,
          status: newVariantStatus
        }, connection);

        // 4.4. Sync parent product status
        const newProductStatus = stockAfter > 0 ? 'active' : 'out_of_stock';
        await ProductRepository.updateProductStatus(variant.product_id, newProductStatus, connection);

        // 4.5. Log to inventory_logs
        let changeType = 'manual_adjustment';
        if (quantityChanged > 0) {
          changeType = 'import';
        }

        const noteText = item.note || (quantityChanged >= 0 ? `Nhập thêm +${quantityChanged} thiết bị` : `Xuất/Điều chỉnh giảm ${quantityChanged} thiết bị`);

        await LogRepository.insertInventoryLog({
          variant_id: variantId,
          staff_id: operatorInfo.staff_id || null,
          manager_id: operatorInfo.manager_id || null,
          change_type: changeType,
          quantity_changed: quantityChanged,
          stock_after: stockAfter,
          note: noteText
        }, connection);

        results.push({
          variant_id: variantId,
          sku: variant.sku,
          stock_before: currentStock,
          quantity_changed: quantityChanged,
          stock_after: stockAfter,
          status: newVariantStatus
        });
      }

      // 4.6. Commit transaction
      await BaseRepository.commit(connection);

      return {
        success: true,
        updatedCount: results.length,
        results,
        message: `Đã hoàn tất điều chỉnh tồn kho cho ${results.length} mục thành công!`
      };
    } catch (error) {
      await BaseRepository.rollback(connection);
      throw error;
    } finally {
      BaseRepository.releaseConnection(connection);
    }
  }

  /**
   * Query inventory history logs
   */
  static async getInventoryLogs(options = {}) {
    return await LogRepository.getInventoryLogs(options);
  }

  /**
   * Query audit logs
   */
  static async getAuditLogs(options = {}) {
    return await LogRepository.getAuditLogs(options);
  }
}

module.exports = ProductService;
