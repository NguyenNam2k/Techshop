const pool = require('../config/database');

async function getProductById(id) {
  let connection;
  try {
    connection = await pool.getConnection();
    const isId = /^\d+$/.test(String(id).trim());

    let productQuery = `
      SELECT p.id, p.name, p.slug, p.brand, p.model_code, p.base_price,
             p.description, p.thumbnail_url, p.warranty_months, p.status,
             p.category_id,
             c.name AS category_name, c.slug AS category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE ${isId ? 'p.id = ?' : 'p.slug = ?'} AND p.status != 'archived'
    `;

    let [productRows] = await connection.query(productQuery, [id]);

    if (productRows.length === 0 && isId) {
      const fallbackQuery = `
        SELECT p.id, p.name, p.slug, p.brand, p.model_code, p.base_price,
               p.description, p.thumbnail_url, p.warranty_months, p.status,
               p.category_id,
               c.name AS category_name, c.slug AS category_slug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.slug = ? AND p.status != 'archived'
      `;
      [productRows] = await connection.query(fallbackQuery, [id]);
    }

    if (productRows.length === 0) {
      return null; 
    }

    const product = productRows[0];

    const variantsQuery = `
      SELECT id, sku, color, color_code, spec_version, price, stock, image_url, status
      FROM product_variants
      WHERE product_id = ?
      ORDER BY id
    `;
    const [variantRows] = await connection.query(variantsQuery, [product.id]);

    const imagesQuery = `
      SELECT id, image_url, angle_label, is_primary, sort_order
      FROM product_images
      WHERE product_id = ?
      ORDER BY sort_order ASC
    `;
    const [imageRows] = await connection.query(imagesQuery, [product.id]);

    const specsQuery = `
      SELECT id, spec_group, spec_name, spec_value, sort_order
      FROM product_specifications
      WHERE product_id = ?
      ORDER BY sort_order
    `;
    const [specRows] = await connection.query(specsQuery, [product.id]);

    const specsMap = {};
    specRows.forEach(spec => {
      if (!specsMap[spec.spec_group]) {
        specsMap[spec.spec_group] = [];
      }
      specsMap[spec.spec_group].push({
        name: spec.spec_name,
        value: spec.spec_value
      });
    });

    const specifications = Object.keys(specsMap).map(group => ({
      group,
      specs: specsMap[group]
    }));

    const productData = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      brand: product.brand,
      model_code: product.model_code,
      base_price: parseFloat(product.base_price),
      description: product.description,
      thumbnail_url: product.thumbnail_url,
      warranty_months: product.warranty_months,
      status: product.status,
      category_id: product.category_id,
      category_name: product.category_name,
      category_slug: product.category_slug,
      variants: variantRows.map(variant => ({
        id: variant.id,
        sku: variant.sku,
        color: variant.color,
        color_code: variant.color_code,
        spec_version: variant.spec_version,
        price: parseFloat(variant.price),
        stock: Number(variant.stock) || 0,
        image_url: variant.image_url,
        status: variant.status
      })),
      images: imageRows.map(image => ({
        id: image.id,
        image_url: image.image_url,
        angle_label: image.angle_label,
        is_primary: Boolean(image.is_primary),
        sort_order: image.sort_order
      })),
      specifications: specifications
    };

    return productData;
  } catch (err) {
    console.error('Error in getProductByIdentifier:', err);
    throw err;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

async function getProductVariantsById(id) {
  let connection;
  try {
    connection = await pool.getConnection();

    const isId = /^\d+$/.test(String(id).trim());

    let productQuery = `
      SELECT id, name, slug, model_code, base_price, status
      FROM products
      WHERE ${isId ? 'id = ?' : 'slug = ?'} AND status != 'archived'
    `;
    let [productRows] = await connection.query(productQuery, [id]);

    if (productRows.length === 0 && isId) {
      const fallbackQuery = `
        SELECT id, name, slug, model_code, base_price, status
        FROM products
        WHERE slug = ? AND status != 'archived'
      `;
      [productRows] = await connection.query(fallbackQuery, [id]);
    }

    if (productRows.length === 0) {
      return null;
    }

    const product = productRows[0];

    const variantsQuery = `
      SELECT id, sku, color, color_code, spec_version, price, stock, image_url, status
      FROM product_variants
      WHERE product_id = ?
      ORDER BY id ASC
    `;
    const [variantRows] = await connection.query(variantsQuery, [product.id]);

    return {
      product_id: product.id,
      product_name: product.name,
      slug: product.slug,
      variants: variantRows.map(v => ({
        id: v.id,
        sku: v.sku,
        color: v.color,
        color_code: v.color_code,
        spec_version: v.spec_version,
        price: parseFloat(v.price),
        stock: Number(v.stock) || 0,
        image_url: v.image_url,
        status: v.status
      }))
    };
  } catch (err) {
    console.error('Error in getProductVariantsByIdentifier:', err);
    throw err;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}


async function getSimilarProducts(id, limit = 8) {
  let connection;
  try {
    connection = await pool.getConnection();

    const isId = /^\d+$/.test(String(id).trim());

    let findQuery = `
      SELECT id, category_id, name FROM products
      WHERE ${isId ? 'id = ?' : 'slug = ?'} AND status != 'archived'
    `;
    let [currentRows] = await connection.query(findQuery, [id]);

    if (currentRows.length === 0 && isId) {
      [currentRows] = await connection.query(
        `SELECT id, category_id, name FROM products WHERE slug = ? AND status != 'archived'`,
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
        WHERE p.category_id = ? AND p.id != ? AND p.status != 'archived'
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
      const [randomRows] = await connection.query(randomQuery, [...existingIds, needed]);
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

    return combined;
  } catch (err) {
    console.error('Error in getSimilarProducts:', err);
    throw err;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

module.exports = {
  getProductById,
  getProductByIdentifier: getProductById,
  getProductVariantsById,
  getProductVariantsByIdentifier: getProductVariantsById,
  getSimilarProducts
};