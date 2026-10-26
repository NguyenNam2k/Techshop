const ProductRepository = require('../../repositories/manager/ProductRepository');
const CategoryRepository = require('../../repositories/manager/categoryRepository');
const LogRepository = require('../../repositories/admin/logRepository');
const BaseRepository = require('../../repositories/baseRepository');
const { pool } = require('../../config/database');

/**
 * Product Service
 * Handles business logic, domain rules, and ACID transaction orchestrations
 * for:
 * 1. Customer Catalog & PDP (Detailed view, specs, image galleries, variants, similarity)
 * 2. Manager Portal Catalog & Inventory Management (CRUD, Stock Guard Safe Delete, Restock)
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
   * Get paginated products with filtering and sorting (for Manager Catalog)
   */
  static async getProducts(filters = {}) {
    return await ProductRepository.findAll(filters);
  }

  /**
   * Get KPI statistics for Catalog overview (for Manager Dashboard)
   */
  static async getCatalogStats() {
    return await ProductRepository.getCatalogStats();
  }

  /**
   * Get single product with full category, variants, images, specs (Both Manager & PDP)
   */
  static async getProductById(id) {
    try {
      const isId = /^\d+$/.test(String(id).trim());

      let productQuery = `
        SELECT p.*, c.name AS category_name, c.slug AS category_slug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE ${isId ? 'p.id = ?' : 'p.slug = ?'} AND p.status != 'archived'
      `;
      let [productRows] = await pool.query(productQuery, [id]);

      if (productRows.length === 0 && isId) {
        const fallbackQuery = `
          SELECT p.*, c.name AS category_name, c.slug AS category_slug
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE p.slug = ? AND p.status != 'archived'
        `;
        [productRows] = await pool.query(fallbackQuery, [id]);
      }

      if (productRows.length === 0) {
        return null;
      }

      const product = productRows[0];

      // Lấy danh sách biến thể
      const variantsQuery = `
        SELECT id, sku, color, color_code, spec_version, price, stock, image_url, status
        FROM product_variants
        WHERE product_id = ?
        ORDER BY id ASC
      `;
      const [variantRows] = await pool.query(variantsQuery, [product.id]);

      // Lấy danh sách ảnh chi tiết
      const imagesQuery = `
        SELECT id, image_url, angle_label, is_primary, sort_order
        FROM product_images
        WHERE product_id = ?
        ORDER BY sort_order ASC
      `;
      const [imageRows] = await pool.query(imagesQuery, [product.id]);

      const finalImages = imageRows.length > 0 ? imageRows : [
        {
          id: 0,
          image_url: product.thumbnail_url || '/placeholder.svg',
          angle_label: 'Chính diện',
          is_primary: true,
          sort_order: 1
        }
      ];

      // Lấy thông số kỹ thuật
      const specsQuery = `
        SELECT id, spec_group, spec_name, spec_value, sort_order
        FROM product_specifications
        WHERE product_id = ?
        ORDER BY sort_order ASC
      `;
      const [specRows] = await pool.query(specsQuery, [product.id]);

      // Tính toán giá min/max và tồn kho tổng
      const prices = variantRows.map(v => parseFloat(v.price)).filter(p => !isNaN(p));
      const minPrice = prices.length > 0 ? Math.min(...prices) : parseFloat(product.base_price);
      const maxPrice = prices.length > 0 ? Math.max(...prices) : parseFloat(product.base_price);

      const totalStock = variantRows.reduce((sum, v) => sum + (parseInt(v.stock, 10) || 0), 0);
      const inStock = totalStock > 0;

      // Group specs by spec_group
      const groupedSpecs = {};
      specRows.forEach(spec => {
        const group = spec.spec_group || 'Thông số chung';
        if (!groupedSpecs[group]) {
          groupedSpecs[group] = [];
        }
        groupedSpecs[group].push({
          name: spec.spec_name,
          value: spec.spec_value
        });
      });

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        brand: product.brand,
        model_code: product.model_code,
        category_id: product.category_id,
        category_name: product.category_name,
        category_slug: product.category_slug,
        base_price: parseFloat(product.base_price),
        min_price: minPrice,
        max_price: maxPrice,
        description: product.description,
        thumbnail_url: product.thumbnail_url,
        warranty_months: product.warranty_months,
        warranty_text: product.warranty_months ? `Bảo hành ${product.warranty_months} tháng chính hãng` : 'Bảo hành chính hãng',
        status: product.status,
        total_stock: totalStock,
        in_stock: inStock,
        sku_code: variantRows[0] ? variantRows[0].sku : '',
        default_variant: variantRows[0] || null,
        variants: variantRows.map(v => ({
          id: v.id,
          sku: v.sku,
          color: v.color,
          color_code: v.color_code,
          spec_version: v.spec_version,
          price: parseFloat(v.price),
          stock: parseInt(v.stock, 10),
          image_url: v.image_url,
          status: v.status,
          in_stock: parseInt(v.stock, 10) > 0
        })),
        images: finalImages,
        specifications: specRows,
        specifications_grouped: groupedSpecs,
        created_at: product.created_at,
        updated_at: product.updated_at
      };
    } catch (err) {
      console.error('Error in getProductById:', err);
      throw err;
    }
  }

  /**
   * =========================================================================
   * TRANSACTION 1: Create Product with Initial Inventory
   * =========================================================================
   */
  static async createProduct({
    name,
    category_id,
    brand,
    base_price,
    initial_stock,
    sku_code,
    description,
    thumbnail_url = null,
    images = [],
    manager_id = null
  }) {
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

      const skuExists = await ProductRepository.checkSkuExists(cleanSku, null, connection);
      if (skuExists) {
        const error = new Error(`Mã SKU "${cleanSku}" đã tồn tại trên hệ thống. Vui lòng nhập mã SKU khác.`);
        error.statusCode = 400;
        throw error;
      }

      const category = await CategoryRepository.findById(category_id, connection);
      if (!category) {
        const error = new Error(`Danh mục (ID: ${category_id}) không tồn tại.`);
        error.statusCode = 404;
        throw error;
      }

      const slug = await this.generateUniqueSlug(cleanName, null, connection);
      const cleanThumbnail = thumbnail_url && thumbnail_url.trim() ? thumbnail_url.trim() : null;

      const productId = await ProductRepository.insertProduct({
        category_id: parseInt(category_id, 10),
        created_by_manager_id: manager_id || 1,
        name: cleanName,
        slug,
        brand: cleanBrand,
        model_code: cleanSku,
        base_price: priceNum,
        description: cleanDesc,
        thumbnail_url: cleanThumbnail,
        warranty_months: 12,
        status: stockNum > 0 ? 'active' : 'out_of_stock'
      }, connection);

      const variantId = await ProductRepository.insertVariant({
        product_id: productId,
        sku: cleanSku,
        color: 'Tiêu chuẩn',
        color_code: '#06B6D4',
        spec_version: 'Bản tiêu chuẩn',
        price: priceNum,
        stock: stockNum,
        status: stockNum > 0 ? 'available' : 'out_of_stock'
      }, connection);

      // Insert primary image into product_images if thumbnail is provided
      if (cleanThumbnail) {
        await ProductRepository.insertProductImage({
          product_id: productId,
          variant_id: variantId,
          image_url: cleanThumbnail,
          angle_label: 'Ảnh đại diện chính',
          is_primary: true,
          sort_order: 0
        }, connection);
      }

      // Insert additional gallery images if provided
      if (Array.isArray(images) && images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const item = images[i];
          const imgUrl = typeof item === 'string' ? item.trim() : (item.image_url ? item.image_url.trim() : '');
          if (imgUrl && imgUrl !== cleanThumbnail) {
            await ProductRepository.insertProductImage({
              product_id: productId,
              variant_id: variantId,
              image_url: imgUrl,
              angle_label: (typeof item === 'object' && item.angle_label) ? item.angle_label : `Góc nhìn phụ ${i + 1}`,
              is_primary: false,
              sort_order: i + 1
            }, connection);
          }
        }
      }

      await LogRepository.insertInventoryLog({
        variant_id: variantId,
        manager_id: manager_id || 1,
        change_type: 'import',
        quantity_changed: stockNum,
        stock_after: stockNum,
        note: `Khởi tạo thiết bị ban đầu với ${stockNum} sản phẩm (SKU: ${cleanSku})`
      }, connection);

      await BaseRepository.commit(connection);

      return {
        success: true,
        productId,
        variantId,
        name: cleanName,
        sku: cleanSku,
        stock: stockNum,
        price: priceNum,
        message: `Đã tạo mới thiết bị "${cleanName}" thành công với mã SKU ${cleanSku}!`
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
   */
  static async updateProduct(productId, {
    name,
    category_id,
    brand,
    base_price,
    sku_code,
    description,
    thumbnail_url,
    changed_by = 'Manager'
  }) {
    const prodId = parseInt(productId, 10);
    if (!prodId) throw new Error('ID thiết bị không hợp lệ.');

    const cleanName = name ? name.trim() : null;
    const cleanBrand = brand ? brand.trim() : null;
    const cleanSku = sku_code ? sku_code.trim().toUpperCase() : null;
    const cleanDesc = description !== undefined ? description.trim() : null;
    const priceNum = base_price !== undefined ? parseFloat(base_price) : null;
    const cleanThumbnail = thumbnail_url !== undefined && thumbnail_url !== null ? thumbnail_url.trim() : undefined;

    const connection = await BaseRepository.getConnection();

    try {
      await BaseRepository.beginTransaction(connection);

      const existingProduct = await ProductRepository.findProductRawById(prodId, connection, { forUpdate: true });
      if (!existingProduct) {
        const error = new Error(`Thiết bị (ID: ${prodId}) không tồn tại.`);
        error.statusCode = 404;
        throw error;
      }

      if (category_id) {
        const cat = await CategoryRepository.findById(category_id, connection);
        if (!cat) {
          const error = new Error(`Danh mục (ID: ${category_id}) không tồn tại.`);
          error.statusCode = 404;
          throw error;
        }
      }

      let newSlug = existingProduct.slug;
      if (cleanName && cleanName !== existingProduct.name) {
        newSlug = await this.generateUniqueSlug(cleanName, prodId, connection);
      }

      const existingVariants = await ProductRepository.findVariantsByProductId(prodId, connection, { forUpdate: true });

      if (cleanSku && existingVariants.length > 0) {
        const defaultVar = existingVariants[0];
        const isSkuTaken = await ProductRepository.checkSkuExists(cleanSku, defaultVar.id, connection);
        if (isSkuTaken) {
          const error = new Error(`Mã SKU "${cleanSku}" đã được sử dụng bởi biến thể khác.`);
          error.statusCode = 400;
          throw error;
        }
      }

      await ProductRepository.updateProduct(prodId, {
        name: cleanName || existingProduct.name,
        slug: newSlug,
        category_id: category_id ? parseInt(category_id, 10) : existingProduct.category_id,
        brand: cleanBrand || existingProduct.brand,
        base_price: priceNum !== null ? priceNum : existingProduct.base_price,
        description: cleanDesc !== null ? cleanDesc : existingProduct.description,
        thumbnail_url: cleanThumbnail,
        model_code: cleanSku || existingProduct.model_code
      }, connection);

      if (cleanThumbnail) {
        const existingImages = await ProductRepository.findImagesByProductId(prodId, connection);
        const match = existingImages.find(img => img.image_url === cleanThumbnail);
        if (match) {
          await ProductRepository.setPrimaryImage(prodId, match.id, connection);
        } else {
          await ProductRepository.insertProductImage({
            product_id: prodId,
            variant_id: existingVariants[0] ? existingVariants[0].id : null,
            image_url: cleanThumbnail,
            angle_label: 'Ảnh đại diện chính',
            is_primary: true,
            sort_order: 0
          }, connection);
        }
      }

      if (priceNum !== null && !isNaN(priceNum)) {
        for (const variant of existingVariants) {
          await ProductRepository.updateVariant(variant.id, { price: priceNum }, connection);
        }
      }

      if (cleanSku && existingVariants.length > 0) {
        await ProductRepository.updateVariant(existingVariants[0].id, { sku: cleanSku }, connection);
      }

      await LogRepository.insertAuditLog({
        entity_type: 'product',
        entity_id: prodId,
        action: 'UPDATE',
        old_data: {
          name: existingProduct.name,
          base_price: existingProduct.base_price,
          brand: existingProduct.brand,
          category_id: existingProduct.category_id,
          model_code: existingProduct.model_code
        },
        new_data: {
          name: cleanName || existingProduct.name,
          base_price: priceNum !== null ? priceNum : existingProduct.base_price,
          brand: cleanBrand || existingProduct.brand,
          category_id: category_id || existingProduct.category_id,
          model_code: cleanSku || existingProduct.model_code
        },
        changed_by
      }, connection);

      await BaseRepository.commit(connection);

      return {
        success: true,
        productId: prodId,
        name: cleanName || existingProduct.name,
        message: `Đã cập nhật thông tin thiết bị "${cleanName || existingProduct.name}" thành công!`
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
   */
  static async deleteProduct(productId) {
    const prodId = parseInt(productId, 10);
    if (!prodId) throw new Error('ID thiết bị không hợp lệ.');

    const connection = await BaseRepository.getConnection();

    try {
      await BaseRepository.beginTransaction(connection);

      const product = await ProductRepository.findProductRawById(prodId, connection, { forUpdate: true });
      if (!product) {
        const error = new Error(`Thiết bị (ID: ${prodId}) không tồn tại.`);
        error.statusCode = 404;
        throw error;
      }

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

      const variantIds = variants.map(v => v.id);
      if (variantIds.length > 0) {
        await ProductRepository.cleanupVariantDependencies(variantIds, connection);
        await ProductRepository.deleteVariantsByProductId(prodId, connection);
      }

      await ProductRepository.cleanupProductDependencies(prodId, connection);
      await ProductRepository.deleteProduct(prodId, connection);

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

        const variant = await ProductRepository.findVariantById(variantId, connection, { forUpdate: true });
        if (!variant) {
          const error = new Error(`Biến thể (ID: ${variantId}) không tồn tại.`);
          error.statusCode = 404;
          throw error;
        }

        const currentStock = parseInt(variant.stock, 10);
        let stockAfter;
        let quantityChanged;

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

        const newVariantStatus = stockAfter > 0 ? 'available' : 'out_of_stock';
        await ProductRepository.updateVariant(variantId, {
          stock: stockAfter,
          status: newVariantStatus
        }, connection);

        const newProductStatus = stockAfter > 0 ? 'active' : 'out_of_stock';
        await ProductRepository.updateProductStatus(variant.product_id, newProductStatus, connection);

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

  // =========================================================================
  // CUSTOMER PDP HELPER METHODS
  // =========================================================================

  /**
   * Lấy danh sách biến thể của sản phẩm theo Product ID (Customer PDP)
   */
  static async getProductVariantsById(productId) {
    try {
      const query = `
        SELECT id, sku, color, color_code, spec_version, price, stock, image_url, status
        FROM product_variants
        WHERE product_id = ?
        ORDER BY id ASC
      `;
      const [rows] = await pool.query(query, [productId]);
      return rows.map(v => ({
        ...v,
        price: parseFloat(v.price),
        stock: parseInt(v.stock, 10),
        in_stock: parseInt(v.stock, 10) > 0
      }));
    } catch (err) {
      console.error('Error in getProductVariantsById:', err);
      throw err;
    }
  }

  /**
   * Lấy danh sách sản phẩm tương tự (Customer PDP)
   */
  static async getSimilarProducts(productId, categoryId = null, limit = 4) {
    try {
      let targetCategoryId = categoryId;

      if (!targetCategoryId) {
        const [prod] = await pool.query('SELECT category_id FROM products WHERE id = ?', [productId]);
        if (prod.length > 0) {
          targetCategoryId = prod[0].category_id;
        }
      }

      let similar = [];

      if (targetCategoryId) {
        const query = `
          SELECT p.id, p.name, p.slug, p.brand, p.model_code, p.base_price, p.thumbnail_url,
                 c.name AS category_name,
                 COALESCE(MIN(pv.price), p.base_price) AS min_price,
                 COALESCE(SUM(pv.stock), 0) AS total_stock
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          LEFT JOIN product_variants pv ON pv.product_id = p.id
          WHERE p.category_id = ? AND p.id != ? AND p.status != 'archived'
          GROUP BY p.id
          ORDER BY p.id DESC
          LIMIT ?
        `;
        const [rows] = await pool.query(query, [targetCategoryId, productId, limit]);
        similar = rows.map(r => ({
          id: r.id,
          name: r.name,
          slug: r.slug,
          brand: r.brand,
          model_code: r.model_code,
          base_price: parseFloat(r.base_price),
          min_price: parseFloat(r.min_price),
          thumbnail_url: r.thumbnail_url,
          category_name: r.category_name,
          in_stock: Number(r.total_stock) > 0,
          match_type: 'same_category'
        }));
      }

      if (similar.length >= limit) {
        return similar;
      }

      const needed = limit - similar.length;
      const existingIds = [productId, ...similar.map(s => s.id)];
      const placeholders = existingIds.map(() => '?').join(',');

      const randomQuery = `
        SELECT p.id, p.name, p.slug, p.brand, p.model_code, p.base_price, p.thumbnail_url,
               c.name AS category_name,
               COALESCE(MIN(pv.price), p.base_price) AS min_price,
               COALESCE(SUM(pv.stock), 0) AS total_stock
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN product_variants pv ON pv.product_id = p.id
        WHERE p.id NOT IN (${placeholders}) AND p.status != 'archived'
        GROUP BY p.id
        ORDER BY RAND()
        LIMIT ?
      `;
      const [randomRows] = await pool.query(randomQuery, [...existingIds, needed]);
      const randomProducts = randomRows.map(r => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        brand: r.brand,
        model_code: r.model_code,
        base_price: parseFloat(r.base_price),
        min_price: parseFloat(r.min_price),
        thumbnail_url: r.thumbnail_url,
        category_name: r.category_name,
        in_stock: Number(r.total_stock) > 0,
        match_type: 'suggested'
      }));

      return [...similar, ...randomProducts];
    } catch (err) {
      console.error('Error in getSimilarProducts:', err);
      throw err;
    }
  }

  // =========================================================================
  // PRODUCT IMAGE GALLERY SERVICES (Manager Feature)
  // =========================================================================

  /**
   * Get all images of a product
   */
  static async getProductImages(productId) {
    const prodId = parseInt(productId, 10);
    if (!prodId) throw new Error('ID thiết bị không hợp lệ.');
    return await ProductRepository.findImagesByProductId(prodId);
  }

  /**
   * Add image to product gallery
   */
  static async addProductImage(productId, { image_url, angle_label = 'Góc nhìn khác', is_primary = false, variant_id = null }) {
    const prodId = parseInt(productId, 10);
    if (!prodId) throw new Error('ID thiết bị không hợp lệ.');
    if (!image_url || !image_url.trim()) throw new Error('Đường dẫn hình ảnh không được để trống.');

    const cleanUrl = image_url.trim();
    const imageId = await ProductRepository.insertProductImage({
      product_id: prodId,
      variant_id,
      image_url: cleanUrl,
      angle_label: angle_label.trim(),
      is_primary: Boolean(is_primary)
    });

    if (is_primary) {
      await ProductRepository.updateThumbnail(prodId, cleanUrl);
    }

    return {
      success: true,
      imageId,
      image_url: cleanUrl,
      message: 'Thêm hình ảnh cho sản phẩm thành công!'
    };
  }

  /**
   * Delete product image
   */
  static async deleteProductImage(productId, imageId) {
    const prodId = parseInt(productId, 10);
    const imgId = parseInt(imageId, 10);
    if (!prodId || !imgId) throw new Error('Tham số không hợp lệ.');

    const deleted = await ProductRepository.deleteProductImage(imgId);
    if (!deleted) throw new Error('Không tìm thấy hình ảnh để xóa.');

    return {
      success: true,
      message: 'Đã xóa hình ảnh thành công.'
    };
  }

  /**
   * Set primary image for product
   */
  static async setPrimaryImage(productId, imageId) {
    const prodId = parseInt(productId, 10);
    const imgId = parseInt(imageId, 10);
    if (!prodId || !imgId) throw new Error('Tham số không hợp lệ.');

    await ProductRepository.setPrimaryImage(prodId, imgId);
    return {
      success: true,
      message: 'Đã đặt làm ảnh đại diện chính của sản phẩm!'
    };
  }
}

// Support both function-style and class-style exports
ProductService.getProductVariants = ProductService.getProductVariantsById;
ProductService.getProductVariantsById = ProductService.getProductVariantsById;
ProductService.getSimilarProducts = ProductService.getSimilarProducts;

module.exports = ProductService;
module.exports.getProductById = ProductService.getProductById;
module.exports.getProductVariantsById = ProductService.getProductVariantsById;
module.exports.getSimilarProducts = ProductService.getSimilarProducts;
