const pool = require('../config/database');

async function getProductById(id) {
  let connection;
  try {
    connection = await pool.getConnection();
    const isId = /^\d+$/.test(String(id).trim());
    const selector = isId ? 'p.id = ?' : 'p.slug = ?';
    const params = [id];

    let [productRows] = await connection.query(
      `SELECT p.id, p.name, p.slug, p.brand, p.model_code, p.base_price,
              p.description, p.thumbnail_url, p.warranty_months, p.status,
              p.category_id, c.name AS category_name, c.slug AS category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE ${selector} AND p.status IN ('active', 'out_of_stock')`,
      params
    );

    if (!productRows.length && isId) {
      [productRows] = await connection.query(
        `SELECT p.id, p.name, p.slug, p.brand, p.model_code, p.base_price,
                p.description, p.thumbnail_url, p.warranty_months, p.status,
                p.category_id, c.name AS category_name, c.slug AS category_slug
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.slug = ? AND p.status IN ('active', 'out_of_stock')`,
        [id]
      );
    }

    if (!productRows.length) return null;
    const product = productRows[0];

    const [variantRows] = await connection.query(
      `SELECT id, sku, color, color_code, spec_version, price, stock, image_url, status
       FROM product_variants WHERE product_id = ? ORDER BY id`,
      [product.id]
    );
    const [imageRows] = await connection.query(
      `SELECT id, image_url, angle_label, is_primary, sort_order
       FROM product_images WHERE product_id = ? ORDER BY sort_order ASC`,
      [product.id]
    );
    const [specRows] = await connection.query(
      `SELECT id, spec_group, spec_name, spec_value, sort_order
       FROM product_specifications WHERE product_id = ? ORDER BY sort_order`,
      [product.id]
    );

    const specsMap = {};
    for (const spec of specRows) {
      if (!specsMap[spec.spec_group]) specsMap[spec.spec_group] = [];
      specsMap[spec.spec_group].push({ name: spec.spec_name, value: spec.spec_value });
    }

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      brand: product.brand,
      model_code: product.model_code,
      base_price: Number(product.base_price),
      description: product.description,
      thumbnail_url: product.thumbnail_url,
      warranty_months: product.warranty_months,
      status: product.status,
      category_id: product.category_id,
      category_name: product.category_name,
      category_slug: product.category_slug,
      variants: variantRows.map(variant => ({
        ...variant,
        price: Number(variant.price),
        stock: Number(variant.stock) || 0
      })),
      images: imageRows.map(image => ({
        ...image,
        is_primary: Boolean(image.is_primary)
      })),
      specifications: Object.entries(specsMap).map(([group, specs]) => ({ group, specs }))
    };
  } finally {
    if (connection) connection.release();
  }
}

async function getProductVariantsById(id) {
  let connection;
  try {
    connection = await pool.getConnection();
    const isId = /^\d+$/.test(String(id).trim());
    let [productRows] = await connection.query(
      `SELECT id, name, slug FROM products
       WHERE ${isId ? 'id = ?' : 'slug = ?'} AND status IN ('active', 'out_of_stock')`,
      [id]
    );

    if (!productRows.length && isId) {
      [productRows] = await connection.query(
        `SELECT id, name, slug FROM products
         WHERE slug = ? AND status IN ('active', 'out_of_stock')`,
        [id]
      );
    }
    if (!productRows.length) return null;

    const product = productRows[0];
    const [variants] = await connection.query(
      `SELECT id, sku, color, color_code, spec_version, price, stock, image_url, status
       FROM product_variants WHERE product_id = ? ORDER BY id`,
      [product.id]
    );
    return {
      product_id: product.id,
      product_name: product.name,
      slug: product.slug,
      variants: variants.map(variant => ({
        ...variant,
        price: Number(variant.price),
        stock: Number(variant.stock) || 0
      }))
    };
  } finally {
    if (connection) connection.release();
  }
}

async function getSimilarProducts(id, limit = 8) {
  let connection;
  try {
    connection = await pool.getConnection();

    const isId = /^\d+$/.test(String(id).trim());

    let findQuery = `
      SELECT id, category_id, name FROM products
      WHERE ${isId ? 'id = ?' : 'slug = ?'} AND status IN ('active', 'out_of_stock')
    `;
    let [currentRows] = await connection.query(findQuery, [id]);

    if (currentRows.length === 0 && isId) {
      [currentRows] = await connection.query(
        `SELECT id, category_id, name FROM products WHERE slug = ? AND status IN ('active', 'out_of_stock')`,
        [id]
      );
    }

    if (currentRows.length === 0) {
      return [];
    }

    const currentProduct = currentRows[0];
    const currentId = currentProduct.id;
    const categoryId = currentProduct.category_id;

    let sameCategoryProducts = [];
    if (categoryId) {
      const sameCatQuery = `
        SELECT p.id, p.name, p.slug, p.brand, p.model_code, p.base_price, p.thumbnail_url,
               c.name AS category_name,
               COALESCE(MIN(pv.price), p.base_price) AS min_price,
               COALESCE(SUM(pv.stock), 0) AS total_stock
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN product_variants pv ON pv.product_id = p.id
        WHERE p.category_id = ? AND p.id != ? AND p.status IN ('active', 'out_of_stock')
        GROUP BY p.id
        ORDER BY p.id DESC
        LIMIT ?
      `;
      const [rows] = await connection.query(sameCatQuery, [categoryId, currentId, limit]);
      sameCategoryProducts = rows.map(r => ({
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

    let combined = [...sameCategoryProducts];
    const needed = limit - combined.length;

    if (needed > 0) {
      const existingIds = [currentId, ...combined.map(p => p.id)];
      const placeholders = existingIds.map(() => '?').join(',');

      // First, get count of available products for random selection
      const countQuery = `
        SELECT COUNT(*) as total
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN product_variants pv ON pv.product_id = p.id
        WHERE p.id NOT IN (${placeholders}) AND p.status IN ('active', 'out_of_stock')
        GROUP BY p.id
      `;
      const [countRows] = await connection.query(countQuery, existingIds);
      const availableCount = countRows.length > 0 ? countRows[0].total : 0;

      if (availableCount > 0) {
        // If we need more products than available, just return all available
        if (needed >= availableCount) {
          const allAvailableQuery = `
            SELECT p.id, p.name, p.slug, p.brand, p.model_code, p.base_price, p.thumbnail_url,
                   c.name AS category_name,
                   COALESCE(MIN(pv.price), p.base_price) AS min_price,
                   COALESCE(SUM(pv.stock), 0) AS total_stock
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN product_variants pv ON pv.product_id = p.id
            WHERE p.id NOT IN (${placeholders}) AND p.status IN ('active', 'out_of_stock')
            GROUP BY p.id
            ORDER BY p.id
            LIMIT ?
          `;
          const [allRows] = await connection.query(allAvailableQuery, [...existingIds, availableCount]);
          const allAvailableProducts = allRows.map(r => ({
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
          combined = [...combined, ...allAvailableProducts];
        } else {
          // Use a more efficient random selection technique
          // Instead of ORDER BY RAND(), we'll use a random offset approach
          const offset = Math.floor(Math.random() * availableCount);

          const randomQuery = `
            SELECT p.id, p.name, p.slug, p.brand, p.model_code, p.base_price, p.thumbnail_url,
                   c.name AS category_name,
                   COALESCE(MIN(pv.price), p.base_price) AS min_price,
                   COALESCE(SUM(pv.stock), 0) AS total_stock
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN product_variants pv ON pv.product_id = p.id
            WHERE p.id NOT IN (${placeholders}) AND p.status IN ('active', 'out_of_stock')
            GROUP BY p.id
            ORDER BY p.id
            LIMIT ?, ?
          `;
          const [randomRows] = await connection.query(randomQuery, [...existingIds, offset, needed]);
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

          combined = [...combined, ...randomProducts];
        }
      }
    }

    return combined.slice(0, limit); // Ensure we don't exceed the limit
  } catch (err) {
    console.error('Error in getSimilarProducts:', err);
    throw err;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

async function getAllCategories() {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query(`
      SELECT id, name, slug, description, icon_url AS image_url, sort_order
      FROM categories
      ORDER BY sort_order ASC, name ASC
    `);
    return rows;
  } catch (err) {
    console.error('Error in getAllCategories:', err);
    throw err;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

async function getProductsList({ category, search, brand, sort, limit, page }) {
  let connection;
  try {
    connection = await pool.getConnection();

    // Default values
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    // Build WHERE clause
    let whereConditions = ['p.status IN (\'active\', \'out_of_stock\')'];
    const queryParams = [];

    if (category) {
      whereConditions.push('p.category_id = ?');
      queryParams.push(category);
    }

    if (brand) {
      whereConditions.push('p.brand = ?');
      queryParams.push(brand);
    }

    if (search) {
      whereConditions.push('(p.name LIKE ? OR p.description LIKE ? OR p.model_code LIKE ?)');
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Build ORDER BY clause
    let orderBy = 'p.id DESC'; // default
    if (sort) {
      switch (sort) {
        case 'price_asc':
          orderBy = 'p.base_price ASC';
          break;
        case 'price_desc':
          orderBy = 'p.base_price DESC';
          break;
        case 'name_asc':
          orderBy = 'p.name ASC';
          break;
        case 'name_desc':
          orderBy = 'p.name DESC';
          break;
        case 'newest':
          orderBy = 'p.created_at DESC';
          break;
        default:
          orderBy = 'p.id DESC';
      }
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      ${whereClause}
    `;
    const [countResult] = await connection.query(countQuery, queryParams);
    const total = countResult[0].total;

    // Get products with pagination
    const productsQuery = `
      SELECT p.id, p.name, p.slug, p.brand, p.model_code, p.base_price, p.thumbnail_url,
             p.description, p.created_at,
             c.name AS category_name, c.slug AS category,
             COALESCE(MIN(pv.price), p.base_price) AS min_price,
             COALESCE(SUM(pv.stock), 0) AS total_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_variants pv ON pv.product_id = p.id
      ${whereClause}
      GROUP BY p.id
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;
    const [rows] = await connection.query(productsQuery, [...queryParams, limitNum, offset]);

    const productIds = rows.map(row => row.id);
    const variantsByProduct = {};
    if (productIds.length) {
      const placeholders = productIds.map(() => '?').join(',');
      const [variantRows] = await connection.query(
        `SELECT id, product_id, sku, color, color_code, spec_version, price, stock, status, image_url
         FROM product_variants
         WHERE product_id IN (${placeholders})
         ORDER BY id`,
        productIds
      );
      for (const variant of variantRows) {
        (variantsByProduct[variant.product_id] ||= []).push({
          id: variant.id,
          sku: variant.sku,
          color: variant.color,
          color_code: variant.color_code,
          spec_version: variant.spec_version,
          price: Number(variant.price),
          stock: Number(variant.stock) || 0,
          status: variant.status,
          image_url: variant.image_url
        });
      }
    }

    const products = rows.map(r => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      brand: r.brand,
      model_code: r.model_code,
      base_price: parseFloat(r.base_price),
      min_price: parseFloat(r.min_price),
      price: parseFloat(r.min_price),
      thumbnail_url: r.thumbnail_url,
      description: r.description,
      category_name: r.category_name,
      category: r.category,
      variants: variantsByProduct[r.id] || [],
      in_stock: Number(r.total_stock) > 0,
      inStock: Number(r.total_stock) > 0,
      created_at: r.created_at
    }));

    return {
      total,
      page: pageNum,
      limit: limitNum,
      products
    };
  } catch (err) {
    console.error('Error in getProductsList:', err);
    throw err;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// Export all functions
module.exports = {
  getProductById,
  getProductByIdentifier: getProductById,
  getProductVariantsById,
  getProductVariantsByIdentifier: getProductVariantsById,
  getSimilarProducts,
  getAllCategories,
  getProductsList
};
