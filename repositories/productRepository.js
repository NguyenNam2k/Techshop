const { pool } = require('../config/database');
const BaseRepository = require('./baseRepository');

/**
 * Product Repository
 * Handles direct database access and queries for products and product_variants tables.
 */
class ProductRepository extends BaseRepository {
  /**
   * Find paginated products with aggregate total stock and default variant info
   */
  static async findAll({
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

    const variantAggSubquery = `
      SELECT 
        product_id,
        MIN(id) AS default_variant_id,
        SUM(stock) AS total_stock,
        COUNT(id) AS variant_count
      FROM product_variants
      GROUP BY product_id
    `;

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
   * Find product by ID with full category and variant info
   */
  static async findById(id) {
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
   * Find raw product row by ID (supports transaction connection & FOR UPDATE)
   */
  static async findProductRawById(id, connection = null, options = {}) {
    const executor = connection || pool;
    const forUpdateClause = options.forUpdate ? ' FOR UPDATE' : '';
    const [rows] = await executor.query(
      `SELECT * FROM products WHERE id = ?${forUpdateClause}`,
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Find variants by product ID (supports transaction connection & FOR UPDATE)
   */
  static async findVariantsByProductId(productId, connection = null, options = {}) {
    const executor = connection || pool;
    const forUpdateClause = options.forUpdate ? ' FOR UPDATE' : '';
    const [rows] = await executor.query(
      `SELECT * FROM product_variants WHERE product_id = ? ORDER BY id ASC${forUpdateClause}`,
      [productId]
    );
    return rows;
  }

  /**
   * Find single variant by ID (supports transaction connection & FOR UPDATE)
   */
  static async findVariantById(variantId, connection = null, options = {}) {
    const executor = connection || pool;
    const forUpdateClause = options.forUpdate ? ' FOR UPDATE' : '';
    const [rows] = await executor.query(
      `SELECT * FROM product_variants WHERE id = ?${forUpdateClause}`,
      [variantId]
    );
    return rows[0] || null;
  }

  /**
   * Check if SKU already exists
   */
  static async checkSkuExists(sku, excludeVariantId = null, connection = null) {
    const executor = connection || pool;
    let query = `SELECT id FROM product_variants WHERE sku = ?`;
    const params = [sku];
    if (excludeVariantId) {
      query += ` AND id != ?`;
      params.push(excludeVariantId);
    }
    query += ` LIMIT 1`;
    const [rows] = await executor.query(query, params);
    return rows.length > 0;
  }

  /**
   * Check if Slug already exists in products
   */
  static async checkSlugExists(slug, excludeProductId = null, connection = null) {
    const executor = connection || pool;
    let query = `SELECT id FROM products WHERE slug = ?`;
    const params = [slug];
    if (excludeProductId) {
      query += ` AND id != ?`;
      params.push(excludeProductId);
    }
    query += ` LIMIT 1`;
    const [rows] = await executor.query(query, params);
    return rows.length > 0;
  }

  /**
   * Insert product record
   */
  static async insertProduct(productData, connection = null) {
    const executor = connection || pool;
    const [result] = await executor.query(
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
        productData.category_id,
        productData.created_by_manager_id || null,
        productData.name,
        productData.slug,
        productData.brand,
        productData.model_code || null,
        productData.base_price,
        productData.description || null,
        productData.warranty_months || 12,
        productData.status || 'active'
      ]
    );
    return result.insertId;
  }

  /**
   * Insert product variant record
   */
  static async insertVariant(variantData, connection = null) {
    const executor = connection || pool;
    const [result] = await executor.query(
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
        variantData.product_id,
        variantData.sku,
        variantData.color || 'Tiêu chuẩn',
        variantData.color_code || '#1E293B',
        variantData.spec_version || 'Bản tiêu chuẩn',
        variantData.price,
        variantData.stock,
        variantData.status || 'available'
      ]
    );
    return result.insertId;
  }

  /**
   * Update product record
   */
  static async updateProduct(id, updateData, connection = null) {
    const executor = connection || pool;
    const [result] = await executor.query(
      `UPDATE products SET
        name = ?,
        slug = ?,
        category_id = ?,
        brand = ?,
        base_price = ?,
        description = ?,
        model_code = COALESCE(?, model_code),
        status = COALESCE(?, status),
        updated_at = NOW()
      WHERE id = ?`,
      [
        updateData.name,
        updateData.slug,
        updateData.category_id,
        updateData.brand,
        updateData.base_price,
        updateData.description || null,
        updateData.model_code || null,
        updateData.status || null,
        id
      ]
    );
    return result.affectedRows;
  }

  /**
   * Update product status only
   */
  static async updateProductStatus(id, status, connection = null) {
    const executor = connection || pool;
    const [result] = await executor.query(
      `UPDATE products SET status = ?, updated_at = NOW() WHERE id = ?`,
      [status, id]
    );
    return result.affectedRows;
  }

  /**
   * Update variant record
   */
  static async updateVariant(variantId, updateData, connection = null) {
    const executor = connection || pool;
    const [result] = await executor.query(
      `UPDATE product_variants SET
        price = COALESCE(?, price),
        sku = COALESCE(?, sku),
        stock = COALESCE(?, stock),
        status = COALESCE(?, status),
        updated_at = NOW()
      WHERE id = ?`,
      [
        updateData.price !== undefined ? updateData.price : null,
        updateData.sku !== undefined ? updateData.sku : null,
        updateData.stock !== undefined ? updateData.stock : null,
        updateData.status !== undefined ? updateData.status : null,
        variantId
      ]
    );
    return result.affectedRows;
  }

  /**
   * Delete variant records by product ID
   */
  static async deleteVariantsByProductId(productId, connection = null) {
    const executor = connection || pool;
    const [result] = await executor.query(
      `DELETE FROM product_variants WHERE product_id = ?`,
      [productId]
    );
    return result.affectedRows;
  }

  /**
   * Cascade cleanup dependencies for variants
   */
  static async cleanupVariantDependencies(variantIds, connection = null) {
    if (!variantIds || variantIds.length === 0) return;
    const executor = connection || pool;
    await executor.query(`DELETE FROM inventory_logs WHERE variant_id IN (?)`, [variantIds]);
    await executor.query(`DELETE FROM cart_items WHERE variant_id IN (?)`, [variantIds]);
    await executor.query(`DELETE FROM product_images WHERE variant_id IN (?)`, [variantIds]);
  }

  /**
   * Cascade cleanup dependencies for product
   */
  static async cleanupProductDependencies(productId, connection = null) {
    const executor = connection || pool;
    await executor.query(`DELETE FROM product_specifications WHERE product_id = ?`, [productId]);
    await executor.query(`DELETE FROM product_images WHERE product_id = ?`, [productId]);
  }

  /**
   * Delete product by ID
   */
  static async deleteProduct(id, connection = null) {
    const executor = connection || pool;
    const [result] = await executor.query(
      `DELETE FROM products WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }

  /**
   * Get KPI statistics for Catalog overview
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
}

module.exports = ProductRepository;
