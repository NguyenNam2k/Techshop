const db = require('../config/db');

const ProductRepository = {
  /**
   * Lấy danh sách sản phẩm cho Catalog với bộ lọc đa tiêu chí, phân trang và sắp xếp
   */
  findCatalog: async ({
    page = 1,
    limit = 12,
    sort = 'newest',
    category,
    brands,
    minPrice,
    maxPrice,
    inStock,
    search
  }) => {
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const whereConditions = ["p.status = 'active'"];
    const params = [];

    // Lọc theo Danh mục (ID hoặc Slug)
    if (category) {
      if (/^\d+$/.test(String(category).trim())) {
        whereConditions.push('p.category_id = ?');
        params.push(parseInt(category, 10));
      } else {
        whereConditions.push('c.slug = ?');
        params.push(String(category).trim());
      }
    }

    // Lọc theo Danh sách Thương hiệu (Brands)
    if (brands) {
      const brandList = Array.isArray(brands) ? brands : String(brands).split(',').map(b => b.trim()).filter(Boolean);
      if (brandList.length > 0) {
        const placeholders = brandList.map(() => '?').join(',');
        whereConditions.push(`p.brand IN (${placeholders})`);
        params.push(...brandList);
      }
    }

    // Tìm kiếm từ khóa (Search text: Tên hoặc mã model)
    if (search && search.trim()) {
      whereConditions.push('(p.name LIKE ? OR p.model_code LIKE ? OR p.brand LIKE ?)');
      const kw = `%${search.trim()}%`;
      params.push(kw, kw, kw);
    }

    // Lọc khoảng giá (Dựa trên base_price hoặc min variant price)
    // Dùng HAVING sau GROUP BY hoặc subquery
    const havingConditions = [];
    const havingParams = [];

    if (minPrice !== undefined && minPrice !== null && minPrice !== '') {
      havingConditions.push('effective_price >= ?');
      havingParams.push(parseFloat(minPrice));
    }
    if (maxPrice !== undefined && maxPrice !== null && maxPrice !== '') {
      havingConditions.push('effective_price <= ?');
      havingParams.push(parseFloat(maxPrice));
    }

    // Lọc trạng thái còn hàng (inStock = true)
    if (inStock === 'true' || inStock === true) {
      havingConditions.push('total_stock > 0');
    }

    // Xử lý ORDER BY
    let orderByClause = 'p.created_at DESC';
    if (sort === 'price_asc') {
      orderByClause = 'effective_price ASC, p.id ASC';
    } else if (sort === 'price_desc') {
      orderByClause = 'effective_price DESC, p.id DESC';
    } else if (sort === 'name_asc') {
      orderByClause = 'p.name ASC';
    } else if (sort === 'name_desc') {
      orderByClause = 'p.name DESC';
    } else if (sort === 'popular') {
      orderByClause = 'total_variants DESC, p.id DESC';
    }

    const whereSql = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    const havingSql = havingConditions.length > 0 ? `HAVING ${havingConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.brand,
        p.model_code,
        p.base_price,
        p.thumbnail_url,
        p.warranty_months,
        p.status,
        p.created_at,
        c.id AS category_id,
        c.name AS category_name,
        c.slug AS category_slug,
        COALESCE(MIN(v.price), p.base_price) AS effective_price,
        COALESCE(MIN(v.price), p.base_price) AS min_price,
        COALESCE(MAX(v.price), p.base_price) AS max_price,
        COALESCE(SUM(v.stock), 0) AS total_stock,
        COUNT(v.id) AS total_variants
      FROM products p
      JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_variants v ON p.id = v.product_id AND v.status != 'discontinued'
      ${whereSql}
      GROUP BY p.id
      ${havingSql}
      ORDER BY ${orderByClause}
      LIMIT ? OFFSET ?;
    `;

    const [rows] = await db.query(query, [...params, ...havingParams, take, offset]);
    return rows;
  },

  /**
   * Đếm tổng số sản phẩm thỏa mãn bộ lọc (Phục vụ phân trang)
   */
  countCatalog: async ({
    category,
    brands,
    minPrice,
    maxPrice,
    inStock,
    search
  }) => {
    const whereConditions = ["p.status = 'active'"];
    const params = [];

    if (category) {
      if (/^\d+$/.test(String(category).trim())) {
        whereConditions.push('p.category_id = ?');
        params.push(parseInt(category, 10));
      } else {
        whereConditions.push('c.slug = ?');
        params.push(String(category).trim());
      }
    }

    if (brands) {
      const brandList = Array.isArray(brands) ? brands : String(brands).split(',').map(b => b.trim()).filter(Boolean);
      if (brandList.length > 0) {
        const placeholders = brandList.map(() => '?').join(',');
        whereConditions.push(`p.brand IN (${placeholders})`);
        params.push(...brandList);
      }
    }

    if (search && search.trim()) {
      whereConditions.push('(p.name LIKE ? OR p.model_code LIKE ? OR p.brand LIKE ?)');
      const kw = `%${search.trim()}%`;
      params.push(kw, kw, kw);
    }

    const havingConditions = [];
    const havingParams = [];

    if (minPrice !== undefined && minPrice !== null && minPrice !== '') {
      havingConditions.push('effective_price >= ?');
      havingParams.push(parseFloat(minPrice));
    }
    if (maxPrice !== undefined && maxPrice !== null && maxPrice !== '') {
      havingConditions.push('effective_price <= ?');
      havingParams.push(parseFloat(maxPrice));
    }
    if (inStock === 'true' || inStock === true) {
      havingConditions.push('total_stock > 0');
    }

    const whereSql = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    const havingSql = havingConditions.length > 0 ? `HAVING ${havingConditions.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*) AS total FROM (
        SELECT 
          p.id,
          COALESCE(MIN(v.price), p.base_price) AS effective_price,
          COALESCE(SUM(v.stock), 0) AS total_stock
        FROM products p
        JOIN categories c ON p.category_id = c.id
        LEFT JOIN product_variants v ON p.id = v.product_id AND v.status != 'discontinued'
        ${whereSql}
        GROUP BY p.id
        ${havingSql}
      ) AS filtered_products;
    `;

    const [rows] = await db.query(countQuery, [...params, ...havingParams]);
    return rows[0]?.total || 0;
  },

  /**
   * Lấy Metadata bộ lọc (Danh sách Categories, Brands, Khoảng giá min/max thực tế trong DB)
   */
  getFilterMetadata: async (categorySlug) => {
    // 1. Tất cả categories
    const [categories] = await db.query(`
      SELECT c.id, c.name, c.slug, c.icon_url, COUNT(p.id) AS product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.status = 'active'
      GROUP BY c.id
      ORDER BY c.name ASC
    `);

    // 2. Danh sách brands
    let brandQuery = `
      SELECT DISTINCT p.brand 
      FROM products p 
      WHERE p.status = 'active' AND p.brand IS NOT NULL AND p.brand != ''
    `;
    const brandParams = [];

    if (categorySlug) {
      brandQuery += ' AND p.category_id = (SELECT id FROM categories WHERE slug = ? LIMIT 1)';
      brandParams.push(categorySlug);
    }
    brandQuery += ' ORDER BY p.brand ASC';

    const [brandRows] = await db.query(brandQuery, brandParams);
    const brands = brandRows.map(r => r.brand);

    // 3. Khoảng giá Min/Max thực tế
    const [priceRange] = await db.query(`
      SELECT 
        COALESCE(MIN(COALESCE(v.price, p.base_price)), 0) AS min_price,
        COALESCE(MAX(COALESCE(v.price, p.base_price)), 100000000) AS max_price
      FROM products p
      LEFT JOIN product_variants v ON v.product_id = p.id AND v.status != 'discontinued'
      WHERE p.status = 'active'
    `);

    return {
      categories,
      brands,
      priceRange: {
        min: parseFloat(priceRange[0]?.min_price || 0),
        max: parseFloat(priceRange[0]?.max_price || 100000000)
      }
    };
  },

  /**
   * Lấy chi tiết 1 sản phẩm theo ID hoặc Slug (Kèm biến thể, ảnh, thông số kỹ thuật)
   */
  findByIdOrSlug: async (idOrSlug) => {
    const isId = /^\d+$/.test(String(idOrSlug).trim());

    const productQuery = `
      SELECT 
        p.id, p.name, p.slug, p.brand, p.model_code, p.base_price,
        p.description, p.thumbnail_url, p.warranty_months, p.status, p.created_at,
        c.id AS category_id, c.name AS category_name, c.slug AS category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE ${isId ? 'p.id = ?' : 'p.slug = ?'} AND p.status != 'archived'
      LIMIT 1;
    `;

    const [rows] = await db.query(productQuery, [idOrSlug]);
    if (rows.length === 0) return null;

    const product = rows[0];

    // Lấy biến thể
    const [variants] = await db.query(`
      SELECT id, sku, color, color_code, spec_version, price, stock, image_url, status
      FROM product_variants
      WHERE product_id = ?
      ORDER BY id ASC
    `, [product.id]);

    // Lấy ảnh chi tiết
    const [images] = await db.query(`
      SELECT id, image_url, angle_label, is_primary, sort_order
      FROM product_images
      WHERE product_id = ?
      ORDER BY sort_order ASC
    `, [product.id]);

    // Lấy thông số kỹ thuật
    const [specs] = await db.query(`
      SELECT id, spec_group, spec_name, spec_value, sort_order
      FROM product_specifications
      WHERE product_id = ?
      ORDER BY sort_order ASC
    `, [product.id]);

    return {
      ...product,
      base_price: parseFloat(product.base_price),
      variants: variants.map(v => ({
        ...v,
        price: parseFloat(v.price),
        stock: parseInt(v.stock, 10)
      })),
      images,
      specifications: specs
    };
  }
};

module.exports = ProductRepository;
