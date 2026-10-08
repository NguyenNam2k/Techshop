const { pool } = require('../config/database');
const CategoryModel = require('./categoryModel');

/**
 * Product Model
 * Implements catalog querying, filtering, pagination, and the 5 core business transactions.
 */
class ProductModel {
  /**
   * Helper: Generate URL-safe and DB-unique slug
   */
  static slugify(text) {
    const baseSlug = text
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove Vietnamese accents
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    return baseSlug || 'product';
  }

  /**
   * Generate unique slug by checking against database
   */
  static async generateUniqueSlug(connection, name, excludeProductId = null) {
    const baseSlug = this.slugify(name);
    let candidate = baseSlug;
    let counter = 1;

    while (true) {
      let query = `SELECT id FROM products WHERE slug = ?`;
      const params = [candidate];
      if (excludeProductId) {
        query += ` AND id != ?`;
        params.push(excludeProductId);
      }
      const [rows] = await connection.query(query, params);
      if (rows.length === 0) return candidate;
      candidate = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  /**
   * Get paginated products with category and variant aggregation
   * Supports: page, limit, category_id, search (name, brand, sku), status, sort
   */
  static async getProducts({
    page = 1,
    limit = 10,
    category_id = null,
    search = '',
    status = '',
    stock_status = '',
    sort = 'newest'
  }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const whereConditions = ['1=1'];
    const params = [];

    // Filter by Category
    if (category_id && category_id !== 'all' && category_id !== '') {
      whereConditions.push('p.category_id = ?');
      params.push(parseInt(category_id, 10));
    }

    // Filter by Search Keyword (Product Name, Brand, or Variant SKU)
    if (search && search.trim() !== '') {
      whereConditions.push(
        '(p.name LIKE ? OR p.brand LIKE ? OR p.model_code LIKE ? OR pv_default.sku LIKE ?)'
      );
      const kw = `%${search.trim()}%`;
      params.push(kw, kw, kw, kw);
    }

    // Filter by Status
    if (status && status !== 'all' && status !== '') {
      whereConditions.push('p.status = ?');
      params.push(status);
    }

    // Filter by Stock Status
    if (stock_status === 'in_stock') {
      whereConditions.push('COALESCE(pv_agg.total_stock, 0) > 0');
    } else if (stock_status === 'out_of_stock') {
      whereConditions.push('COALESCE(pv_agg.total_stock, 0) = 0');
    } else if (stock_status === 'low_stock') {
      whereConditions.push('COALESCE(pv_agg.total_stock, 0) > 0 AND COALESCE(pv_agg.total_stock, 0) <= 5');
    }

    const whereSql = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Subquery to get default variant (first variant) and aggregated total stock
    const variantAggSubquery = `
      SELECT 
        product_id,
        MIN(id) AS default_variant_id,
        SUM(stock) AS total_stock,
        COUNT(id) AS variant_count
      FROM product_variants
      GROUP BY product_id
    `;

    // Count Total Query
    const countSql = `
      SELECT COUNT(p.id) AS total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN (${variantAggSubquery}) pv_agg ON p.id = pv_agg.product_id
      LEFT JOIN product_variants pv_default ON pv_agg.default_variant_id = pv_default.id
      ${whereSql}
    `;

    const [countRows] = await pool.query(countSql, params);
    const total = countRows[0].total;
    const totalPages = Math.ceil(total / limitNum) || 1;

    // Sorting
    let orderBySql = 'ORDER BY p.id DESC';
    switch (sort) {
      case 'price_asc':
        orderBySql = 'ORDER BY p.base_price ASC';
        break;
      case 'price_desc':
        orderBySql = 'ORDER BY p.base_price DESC';
        break;
      case 'name_asc':
        orderBySql = 'ORDER BY p.name ASC';
        break;
      case 'name_desc':
        orderBySql = 'ORDER BY p.name DESC';
        break;
      case 'stock_asc':
        orderBySql = 'ORDER BY COALESCE(pv_agg.total_stock, 0) ASC';
        break;
      case 'stock_desc':
        orderBySql = 'ORDER BY COALESCE(pv_agg.total_stock, 0) DESC';
        break;
      case 'oldest':
        orderBySql = 'ORDER BY p.id ASC';
        break;
      case 'newest':
      default:
        orderBySql = 'ORDER BY p.id DESC';
        break;
    }

    // Data query
    const dataSql = `
      SELECT 
        p.id,
        p.category_id,
        c.name AS category_name,
        p.name,
        p.slug,
        p.brand,
        p.model_code,
        p.base_price,
        p.description,
        p.thumbnail_url,
        p.warranty_months,
        p.status,
        p.created_at,
        p.updated_at,
        pv_default.id AS default_variant_id,
        pv_default.sku AS sku_code,
        COALESCE(pv_agg.total_stock, pv_default.stock, 0) AS total_stock,
        COALESCE(pv_agg.variant_count, 1) AS variant_count,
        pv_default.price AS variant_price
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN (${variantAggSubquery}) pv_agg ON p.id = pv_agg.product_id
      LEFT JOIN product_variants pv_default ON pv_agg.default_variant_id = pv_default.id
      ${whereSql}
      ${orderBySql}
      LIMIT ? OFFSET ?
    `;

    const [products] = await pool.query(dataSql, [...params, limitNum, offset]);

    return {
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
        startIndex: total === 0 ? 0 : offset + 1,
        endIndex: Math.min(offset + limitNum, total)
      }
    };
  }

  /**
   * Get single product with full category and all variants
   */
  static async getProductById(id) {
    const prodSql = `
      SELECT 
        p.*,
        c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `;
    const [prods] = await pool.query(prodSql, [id]);
    if (prods.length === 0) return null;

    const product = prods[0];

    // Fetch all variants
    const [variants] = await pool.query(
      `SELECT * FROM product_variants WHERE product_id = ? ORDER BY id ASC`,
      [id]
    );

    product.variants = variants;
    product.default_variant = variants[0] || null;
    product.sku_code = variants[0] ? variants[0].sku : '';
    product.total_stock = variants.reduce((sum, v) => sum + Number(v.stock), 0);

    return product;
  }

  /**
   * Get KPI statistics for the Admin Dashboard overview
   */
  static async getCatalogStats() {
    const [prodStats] = await pool.query(`
      SELECT 
        COUNT(p.id) AS total_products,
        COUNT(CASE WHEN p.status = 'active' THEN 1 END) AS active_products,
        COUNT(CASE WHEN p.status = 'out_of_stock' THEN 1 END) AS out_of_stock_products
      FROM products p
    `);

    const [stockStats] = await pool.query(`
      SELECT 
        COALESCE(SUM(stock), 0) AS total_inventory_units,
        COALESCE(SUM(stock * price), 0) AS total_inventory_value,
        COUNT(CASE WHEN stock <= 5 AND stock > 0 THEN 1 END) AS low_stock_variants,
        COUNT(CASE WHEN stock = 0 THEN 1 END) AS zero_stock_variants
      FROM product_variants
    `);

    const [catStats] = await pool.query(`
      SELECT COUNT(id) AS total_categories FROM categories
    `);

    return {
      totalProducts: Number(prodStats[0].total_products || 0),
      activeProducts: Number(prodStats[0].active_products || 0),
      totalStockUnits: Number(stockStats[0].total_inventory_units || 0),
      totalInventoryValue: Number(stockStats[0].total_inventory_value || 0),
      lowStockCount: Number(stockStats[0].low_stock_variants || 0),
      zeroStockCount: Number(stockStats[0].zero_stock_variants || 0),
      totalCategories: Number(catStats[0].total_categories || 0)
    };
  }

  /**
   * =========================================================================
   * TRANSACTION 1: Create Product with Initial Inventory
   * =========================================================================
   * - Thêm mới một thiết bị vào bảng `products`.
   * - Tự động tạo bản ghi biến thể mặc định (Default Variant) trong bảng `product_variants`
   *   với `sku_code`, `price = base_price`, và `stock = initial_stock`.
   * - Ghi log lịch sử nhập kho vào bảng `inventory_logs` (action: 'INITIAL_IMPORT').
   *
   * @param {Object} data - { name, category_id, brand, base_price, initial_stock, sku_code, description, manager_id }
   */
  static async createProductWithInitialInventory({
    name,
    category_id,
    brand,
    base_price,
    initial_stock,
    sku_code,
    description,
    manager_id = null
  }) {
    // 1. Validation input
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

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // 1.1. Kiểm tra SKU đã tồn tại trong product_variants hay chưa
      const [existingSku] = await connection.query(
        `SELECT id FROM product_variants WHERE sku = ? LIMIT 1`,
        [cleanSku]
      );
      if (existingSku.length > 0) {
        const error = new Error(`Mã SKU "${cleanSku}" đã tồn tại trên hệ thống. Vui lòng nhập mã SKU khác.`);
        error.statusCode = 400;
        throw error;
      }

      // 1.2. Kiểm tra danh mục có hợp lệ không
      const [catRows] = await connection.query(
        `SELECT id FROM categories WHERE id = ? LIMIT 1`,
        [category_id]
      );
      if (catRows.length === 0) {
        const error = new Error(`Danh mục (ID: ${category_id}) không tồn tại.`);
        error.statusCode = 400;
        throw error;
      }

      // 1.3. Tạo slug duy nhất
      const uniqueSlug = await this.generateUniqueSlug(connection, cleanName);

      // 1.4. Thêm sản phẩm vào bảng products
      const productStatus = stockNum > 0 ? 'active' : 'out_of_stock';
      const [prodInsert] = await connection.query(
        `INSERT INTO products (
          category_id, 
          created_by_manager_id, 
          name, 
          slug, 
          brand, 
          model_code, 
          base_price, 
          description, 
          warranty_months, 
          status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          category_id,
          manager_id,
          cleanName,
          uniqueSlug,
          cleanBrand,
          cleanSku, // model_code mapped from sku
          priceNum,
          cleanDesc,
          12,
          productStatus
        ]
      );
      const productId = prodInsert.insertId;

      // 1.5. Tạo biến thể mặc định (Default Variant) trong bảng product_variants
      const variantStatus = stockNum > 0 ? 'available' : 'out_of_stock';
      const [variantInsert] = await connection.query(
        `INSERT INTO product_variants (
          product_id, 
          sku, 
          color, 
          color_code, 
          spec_version, 
          price, 
          stock, 
          status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          productId,
          cleanSku,
          'Tiêu chuẩn',
          '#1E293B',
          'Bản tiêu chuẩn',
          priceNum,
          stockNum,
          variantStatus
        ]
      );
      const variantId = variantInsert.insertId;

      // 1.6. Ghi log lịch sử nhập kho vào bảng inventory_logs (action: 'INITIAL_IMPORT')
      await connection.query(
        `INSERT INTO inventory_logs (
          variant_id, 
          manager_id, 
          change_type, 
          quantity_changed, 
          stock_after, 
          note
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          variantId,
          manager_id,
          'import',
          stockNum,
          stockNum,
          'INITIAL_IMPORT: Khởi tạo thiết bị và nhập kho ban đầu'
        ]
      );

      // 1.7. Commit Transaction thành công
      await connection.commit();

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
      // Rollback nếu có lỗi
      await connection.rollback();
      throw error;
    } finally {
      // Giải phóng kết nối
      connection.release();
    }
  }

  /**
   * =========================================================================
   * TRANSACTION 2: Update Product & Sync Variant Price
   * =========================================================================
   * - Cập nhật thông tin cơ bản của thiết bị trong bảng `products`.
   * - Cập nhật đồng bộ giá cơ sở sang bảng `product_variants` cho biến thể mặc định.
   * - Ghi log cập nhật vào bảng `audit_logs`.
   *
   * @param {number|string} productId - ID thiết bị cần cập nhật
   * @param {Object} data - { name, category_id, brand, base_price, sku_code, description, changed_by }
   */
  static async updateProductAndSyncVariantPrice(productId, {
    name,
    category_id,
    brand,
    base_price,
    sku_code,
    description,
    changed_by = 'Admin'
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

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // 2.1. Khóa dòng và lấy dữ liệu hiện tại của thiết bị (để so sánh ghi Audit Log)
      const [existingProds] = await connection.query(
        `SELECT * FROM products WHERE id = ? FOR UPDATE`,
        [prodId]
      );
      if (existingProds.length === 0) {
        const error = new Error(`Thiết bị (ID: ${prodId}) không tồn tại.`);
        error.statusCode = 404;
        throw error;
      }
      const oldProduct = existingProds[0];

      // 2.2. Khóa dòng và lấy biến thể mặc định (variant đầu tiên)
      const [existingVariants] = await connection.query(
        `SELECT * FROM product_variants WHERE product_id = ? ORDER BY id ASC LIMIT 1 FOR UPDATE`,
        [prodId]
      );
      const defaultVariant = existingVariants[0] || null;

      // 2.3. Nếu có cập nhật SKU, kiểm tra trùng lặp với variant khác
      if (cleanSku && defaultVariant && cleanSku !== defaultVariant.sku) {
        const [duplicateSku] = await connection.query(
          `SELECT id FROM product_variants WHERE sku = ? AND id != ? LIMIT 1`,
          [cleanSku, defaultVariant.id]
        );
        if (duplicateSku.length > 0) {
          const error = new Error(`Mã SKU "${cleanSku}" đã được sử dụng bởi biến thể khác.`);
          error.statusCode = 400;
          throw error;
        }
      }

      // 2.4. Cập nhật slug nếu tên thay đổi
      let newSlug = oldProduct.slug;
      if (cleanName !== oldProduct.name) {
        newSlug = await this.generateUniqueSlug(connection, cleanName, prodId);
      }

      // 2.5. Cập nhật thông tin cơ bản trong bảng products
      await connection.query(
        `UPDATE products SET
          name = ?,
          slug = ?,
          category_id = ?,
          brand = ?,
          base_price = ?,
          description = ?,
          model_code = COALESCE(?, model_code),
          updated_at = NOW()
        WHERE id = ?`,
        [
          cleanName,
          newSlug,
          category_id,
          cleanBrand,
          priceNum,
          cleanDesc,
          cleanSku,
          prodId
        ]
      );

      // 2.6. Đồng bộ giá cơ sở sang bảng product_variants cho biến thể mặc định
      if (defaultVariant) {
        await connection.query(
          `UPDATE product_variants SET
            price = ?,
            sku = COALESCE(?, sku),
            updated_at = NOW()
          WHERE id = ?`,
          [priceNum, cleanSku, defaultVariant.id]
        );
      }

      // 2.7. Ghi log cập nhật vào bảng audit_logs
      const auditPayload = {
        name: cleanName,
        category_id,
        brand: cleanBrand,
        base_price: priceNum,
        sku: cleanSku,
        description: cleanDesc
      };

      await connection.query(
        `INSERT INTO audit_logs (
          entity_type, 
          entity_id, 
          action, 
          old_data, 
          new_data, 
          changed_by
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          'product',
          prodId,
          'UPDATE_PRODUCT_SYNC_PRICE',
          JSON.stringify(oldProduct),
          JSON.stringify(auditPayload),
          changed_by
        ]
      );

      // 2.8. Commit Transaction thành công
      await connection.commit();

      return {
        success: true,
        productId: prodId,
        syncedPrice: priceNum,
        message: 'Cập nhật thiết bị và đồng bộ giá biến thể thành công (Audit Log đã ghi).'
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * =========================================================================
   * TRANSACTION 3: Safe Delete/Archive Product
   * =========================================================================
   * - Kiểm tra trạng thái tồn kho của các biến thể thuộc sản phẩm trong `product_variants`.
   * - Nếu tất cả tồn kho bằng 0, xóa mềm hoặc xóa vật lý các bản ghi liên quan trong `product_variants` trước.
   * - Sau đó tiến hành xóa thiết bị trong bảng `products`.
   * - Nếu còn tồn kho > 0 thì ROLLBACK và ném ra lỗi từ chối xóa.
   *
   * @param {number|string} productId - ID thiết bị cần xóa
   */
  static async safeDeleteProduct(productId) {
    const prodId = parseInt(productId, 10);
    if (!prodId) throw new Error('ID thiết bị không hợp lệ.');

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // 3.1. Khóa và kiểm tra thiết bị có tồn tại không
      const [prods] = await connection.query(
        `SELECT id, name FROM products WHERE id = ? FOR UPDATE`,
        [prodId]
      );
      if (prods.length === 0) {
        const error = new Error(`Thiết bị (ID: ${prodId}) không tồn tại.`);
        error.statusCode = 404;
        throw error;
      }
      const product = prods[0];

      // 3.2. Khóa tất cả các biến thể thuộc thiết bị và kiểm tra số lượng tồn kho
      const [variants] = await connection.query(
        `SELECT id, sku, stock FROM product_variants WHERE product_id = ? FOR UPDATE`,
        [prodId]
      );

      // Tính tổng số lượng hàng tồn kho trên toàn bộ biến thể
      const totalStock = variants.reduce((sum, v) => sum + Math.max(0, parseInt(v.stock, 10) || 0), 0);

      // RÀNG BUỘC AN TOÀN: Nếu tồn kho > 0, lập tức ROLLBACK và từ chối xóa
      if (totalStock > 0) {
        const error = new Error(
          `TỪ CHỐI XÓA: Thiết bị "${product.name}" hiện vẫn còn ${totalStock} sản phẩm tồn kho trong hệ thống. ` +
          `Vui lòng điều chỉnh hoặc xả kho về 0 trước khi thực hiện xóa an toàn!`
        );
        error.statusCode = 400;
        error.totalStock = totalStock;
        await connection.rollback();
        throw error;
      }

      // 3.3. Khi tất cả tồn kho = 0: Xóa các bản ghi liên quan theo thứ tự khóa ngoại
      const variantIds = variants.map(v => v.id);

      if (variantIds.length > 0) {
        // Xóa logs nhập xuất kho của các biến thể
        await connection.query(
          `DELETE FROM inventory_logs WHERE variant_id IN (?)`,
          [variantIds]
        );

        // Xóa các liên kết giỏ hàng (nếu có)
        await connection.query(
          `DELETE FROM cart_items WHERE variant_id IN (?)`,
          [variantIds]
        );

        // Xóa hình ảnh phụ liên kết với biến thể
        await connection.query(
          `DELETE FROM product_images WHERE variant_id IN (?)`,
          [variantIds]
        );

        // Xóa tất cả các biến thể trong product_variants
        await connection.query(
          `DELETE FROM product_variants WHERE product_id = ?`,
          [prodId]
        );
      }

      // Xóa thông số kỹ thuật và hình ảnh tổng thể
      await connection.query(
        `DELETE FROM product_specifications WHERE product_id = ?`,
        [prodId]
      );
      await connection.query(
        `DELETE FROM product_images WHERE product_id = ?`,
        [prodId]
      );

      // Xóa thiết bị khỏi bảng products
      await connection.query(
        `DELETE FROM products WHERE id = ?`,
        [prodId]
      );

      // 3.4. Commit Transaction thành công
      await connection.commit();

      return {
        success: true,
        deletedProductId: prodId,
        productName: product.name,
        message: `Đã xóa thiết bị "${product.name}" an toàn do tồn kho đã về 0.`
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * =========================================================================
   * TRANSACTION 4: Batch Adjust Stock / Restock
   * =========================================================================
   * - Nhận danh sách một hoặc nhiều sản phẩm cần cập nhật kho.
   * - Khóa hàng dữ liệu bằng truy vấn:
   *   `SELECT stock FROM product_variants WHERE id = ? FOR UPDATE`
   * - Cập nhật số lượng tồn kho mới và ghi log chi tiết số lượng thay đổi vào `inventory_logs`.
   *
   * @param {Array<Object>} adjustments - Mảng các mục điều chỉnh:
   *   [{ variant_id, new_stock, quantity_change, note, staff_id, manager_id }]
   */
  static async batchAdjustStock(adjustments, operatorInfo = {}) {
    if (!Array.isArray(adjustments) || adjustments.length === 0) {
      throw new Error('Danh sách điều chỉnh tồn kho không được để trống.');
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const results = [];

      for (const item of adjustments) {
        const variantId = parseInt(item.variant_id || item.id, 10);
        if (!variantId) {
          throw new Error('Mỗi mục điều chỉnh phải có variant_id hợp lệ.');
        }

        // 4.1. Khóa hàng dữ liệu của biến thể bằng SELECT ... FOR UPDATE
        const [variantRows] = await connection.query(
          `SELECT id, product_id, sku, price, stock 
           FROM product_variants 
           WHERE id = ? FOR UPDATE`,
          [variantId]
        );

        if (variantRows.length === 0) {
          const error = new Error(`Biến thể (ID: ${variantId}) không tồn tại.`);
          error.statusCode = 404;
          throw error;
        }

        const variant = variantRows[0];
        const currentStock = parseInt(variant.stock, 10);

        // 4.2. Tính toán tồn kho sau cập nhật
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

        // 4.3. Cập nhật tồn kho và trạng thái biến thể
        const newStatus = stockAfter > 0 ? 'available' : 'out_of_stock';
        await connection.query(
          `UPDATE product_variants 
           SET stock = ?, status = ?, updated_at = NOW() 
           WHERE id = ?`,
          [stockAfter, newStatus, variantId]
        );

        // 4.4. Cập nhật trạng thái sản phẩm cha nếu cần
        const prodStatus = stockAfter > 0 ? 'active' : 'out_of_stock';
        await connection.query(
          `UPDATE products SET status = ?, updated_at = NOW() WHERE id = ?`,
          [prodStatus, variant.product_id]
        );

        // 4.5. Xác định change_type cho inventory_logs
        let changeType = 'manual_adjustment';
        if (quantityChanged > 0) {
          changeType = 'import';
        }

        const noteText = item.note || (quantityChanged >= 0 ? `Nhập thêm +${quantityChanged} thiết bị` : `Xuất/Điều chỉnh giảm ${quantityChanged} thiết bị`);

        // 4.6. Ghi log chi tiết số lượng thay đổi vào inventory_logs
        await connection.query(
          `INSERT INTO inventory_logs (
            variant_id, 
            staff_id, 
            manager_id, 
            change_type, 
            quantity_changed, 
            stock_after, 
            note
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            variantId,
            operatorInfo.staff_id || null,
            operatorInfo.manager_id || null,
            changeType,
            quantityChanged,
            stockAfter,
            noteText
          ]
        );

        results.push({
          variant_id: variantId,
          sku: variant.sku,
          stock_before: currentStock,
          quantity_changed: quantityChanged,
          stock_after: stockAfter,
          status: newStatus
        });
      }

      // 4.7. Commit Transaction thành công
      await connection.commit();

      return {
        success: true,
        updatedCount: results.length,
        results,
        message: `Đã hoàn tất điều chỉnh tồn kho cho ${results.length} mục thành công!`
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Helper: Delegate to CategoryModel for Transaction 5
   */
  static async deleteCategoryWithCascadeReassignment(categoryId, defaultCategoryId = 1) {
    return CategoryModel.deleteCategoryWithCascadeReassignment(categoryId, defaultCategoryId);
  }

  /**
   * Query inventory history logs for a product or overall catalog
   */
  static async getInventoryLogs({ limit = 30, variantId = null, productId = null }) {
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (variantId) {
      whereClause += ' AND l.variant_id = ?';
      params.push(variantId);
    } else if (productId) {
      whereClause += ' AND pv.product_id = ?';
      params.push(productId);
    }

    const sql = `
      SELECT 
        l.id,
        l.variant_id,
        pv.sku,
        p.name AS product_name,
        l.change_type,
        l.quantity_changed,
        l.stock_after,
        l.note,
        l.created_at,
        COALESCE(m.full_name, 'Hệ thống') AS manager_name
      FROM inventory_logs l
      JOIN product_variants pv ON l.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      LEFT JOIN managers m ON l.manager_id = m.id
      ${whereClause}
      ORDER BY l.id DESC
      LIMIT ?
    `;

    const [rows] = await pool.query(sql, [...params, limit]);
    return rows;
  }

  /**
   * Query audit logs
   */
  static async getAuditLogs({ limit = 30, entityId = null }) {
    let whereClause = "WHERE entity_type = 'product'";
    const params = [];

    if (entityId) {
      whereClause += ' AND entity_id = ?';
      params.push(entityId);
    }

    const sql = `
      SELECT *
      FROM audit_logs
      ${whereClause}
      ORDER BY id DESC
      LIMIT ?
    `;
    const [rows] = await pool.query(sql, [...params, limit]);
    return rows;
  }
}

module.exports = ProductModel;
