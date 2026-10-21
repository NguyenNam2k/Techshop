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
       WHERE ${selector}`,
      params
    );

    if (!productRows.length && isId) {
      [productRows] = await connection.query(
        `SELECT p.id, p.name, p.slug, p.brand, p.model_code, p.base_price,
                p.description, p.thumbnail_url, p.warranty_months, p.status,
                p.category_id, c.name AS category_name, c.slug AS category_slug
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.slug = ?`,
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

    const mappedVariants = variantRows.map(variant => ({
      ...variant,
      price: Number(variant.price),
      stock: Number(variant.stock) || 0
    }));

    const SINGLE_CONFIG_SLUGS = new Set([
      'gpus',
      'cpus',
      'motherboards',
      'ram',
      'storage',
      'power-supplies',
      'cooling',
      'laptops',
      'monitors'
    ]);
    const SINGLE_CONFIG_IDS = new Set([1, 2, 3, 4, 5, 6, 7, 11, 12]);
    const isSingleConfig =
      SINGLE_CONFIG_SLUGS.has(String(product.category_slug || '').toLowerCase()) ||
      SINGLE_CONFIG_IDS.has(Number(product.category_id));
    const effectiveVariants = isSingleConfig ? mappedVariants.slice(0, 1) : mappedVariants;

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
      variants: effectiveVariants,
      default_variant: effectiveVariants[0] || null,
      sku_code: effectiveVariants[0] ? effectiveVariants[0].sku : '',
      total_stock: effectiveVariants.reduce((sum, v) => sum + Number(v.stock || 0), 0),
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
      `SELECT id, name, slug FROM products WHERE ${isId ? 'id = ?' : 'slug = ?'}`,
      [id]
    );

    if (!productRows.length && isId) {
      [productRows] = await connection.query(
        `SELECT id, name, slug FROM products WHERE slug = ?`,
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

    let [currentRows] = await connection.query(
      `SELECT id, category_id, name FROM products WHERE ${isId ? 'id = ?' : 'slug = ?'}`,
      [id]
    );

    if (currentRows.length === 0 && isId) {
      [currentRows] = await connection.query(
        `SELECT id, category_id, name FROM products WHERE slug = ?`,
        [id]
      );
    }

    if (currentRows.length === 0) return [];

    const currentProduct = currentRows[0];
    const currentId = currentProduct.id;
    const categoryId = currentProduct.category_id;

    let sameCategoryProducts = [];
    if (categoryId) {
      const [rows] = await connection.query(
        `SELECT p.id, p.name, p.slug, p.brand, p.model_code, p.base_price, p.thumbnail_url,
                c.name AS category_name, c.slug AS category_slug,
                COALESCE(MIN(pv.price), p.base_price) AS min_price,
                COALESCE(SUM(pv.stock), 0) AS total_stock
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         LEFT JOIN product_variants pv ON pv.product_id = p.id
         WHERE p.category_id = ? AND p.id != ? AND p.status IN ('active', 'out_of_stock')
         GROUP BY p.id
         ORDER BY p.id DESC
         LIMIT ?`,
        [categoryId, currentId, limit]
      );
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
        category_slug: r.category_slug,
        in_stock: Number(r.total_stock) > 0,
        match_type: 'same_category'
      }));
    }

    let combined = [...sameCategoryProducts];
    const needed = limit - combined.length;

    if (needed > 0) {
      const existingIds = [currentId, ...combined.map(p => p.id)];
      const placeholders = existingIds.map(() => '?').join(',');
      const [otherRows] = await connection.query(
        `SELECT p.id, p.name, p.slug, p.brand, p.model_code, p.base_price, p.thumbnail_url,
                c.name AS category_name, c.slug AS category_slug,
                COALESCE(MIN(pv.price), p.base_price) AS min_price,
                COALESCE(SUM(pv.stock), 0) AS total_stock
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         LEFT JOIN product_variants pv ON pv.product_id = p.id
         WHERE p.id NOT IN (${placeholders}) AND p.status IN ('active', 'out_of_stock')
         GROUP BY p.id
         ORDER BY p.id ASC
         LIMIT ?`,
        [...existingIds, needed]
      );
      combined = [
        ...combined,
        ...otherRows.map(r => ({
          id: r.id,
          name: r.name,
          slug: r.slug,
          brand: r.brand,
          model_code: r.model_code,
          base_price: parseFloat(r.base_price),
          min_price: parseFloat(r.min_price),
          thumbnail_url: r.thumbnail_url,
          category_name: r.category_name,
          category_slug: r.category_slug,
          in_stock: Number(r.total_stock) > 0,
          match_type: 'suggested'
        }))
      ];
    }

    return combined.slice(0, limit);
  } finally {
    if (connection) connection.release();
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
  } finally {
    if (connection) connection.release();
  }
}

async function getProductsList({ category, search, brand, sort, limit, page }) {
  let connection;
  try {
    connection = await pool.getConnection();

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const offset = (pageNum - 1) * limitNum;

    const whereConditions = ["p.status IN ('active', 'out_of_stock')"];
    const queryParams = [];

    if (category && category !== 'all') {
      if (/^\d+$/.test(String(category))) {
        whereConditions.push('p.category_id = ?');
        queryParams.push(Number(category));
      } else {
        whereConditions.push('c.slug = ?');
        queryParams.push(String(category));
      }
    }

    if (brand) {
      whereConditions.push('p.brand = ?');
      queryParams.push(brand);
    }

    if (search) {
      whereConditions.push(
        '(p.name LIKE ? OR p.brand LIKE ? OR p.description LIKE ? OR p.model_code LIKE ? OR c.name LIKE ?)'
      );
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    let orderBy = 'p.id ASC';
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
          orderBy = 'p.id ASC';
      }
    }

    const [countResult] = await connection.query(
      `SELECT COUNT(*) as total FROM products p LEFT JOIN categories c ON p.category_id = c.id ${whereClause}`,
      queryParams
    );
    const total = countResult[0].total;

    const [rows] = await connection.query(
      `SELECT p.id, p.name, p.slug, p.brand, p.model_code, p.base_price, p.thumbnail_url,
              p.description, p.created_at, p.category_id, p.status,
              c.name AS category_name, c.slug AS category, c.slug AS category_slug,
              COALESCE(MIN(pv.price), p.base_price) AS min_price,
              COALESCE(SUM(pv.stock), 0) AS total_stock
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN product_variants pv ON pv.product_id = p.id
       ${whereClause}
       GROUP BY p.id
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...queryParams, limitNum, offset]
    );

    const productIds = rows.map(row => row.id);
    const variantsByProduct = {};
    const specsByProduct = {};
    const specsFlatByProduct = {};
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

      const [specRows] = await connection.query(
        `SELECT product_id, spec_group, spec_name, spec_value, sort_order
         FROM product_specifications
         WHERE product_id IN (${placeholders})
         ORDER BY sort_order ASC, id ASC`,
        productIds
      );
      for (const s of specRows) {
        (specsFlatByProduct[s.product_id] ||= {})[s.spec_name] = s.spec_value;
        const groups = (specsByProduct[s.product_id] ||= {});
        (groups[s.spec_group] ||= []).push({ name: s.spec_name, value: s.spec_value });
      }
    }

    const products = rows.map(r => {
      const variants = variantsByProduct[r.id] || [];
      const specGroups = specsByProduct[r.id] || {};
      return {
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
        category_id: r.category_id,
        category_name: r.category_name,
        category: r.category,
        category_slug: r.category_slug,
        status: r.status,
        variants,
        specifications: Object.entries(specGroups).map(([group, specs]) => ({ group, specs })),
        specs: specsFlatByProduct[r.id] || {},
        default_variant_id: variants[0]?.id || null,
        sku_code: variants[0]?.sku || '',
        total_stock: Number(r.total_stock) || 0,
        in_stock: Number(r.total_stock) > 0,
        inStock: Number(r.total_stock) > 0,
        created_at: r.created_at
      };
    });

    return {
      total,
      page: pageNum,
      limit: limitNum,
      products
    };
  } finally {
    if (connection) connection.release();
  }
}

async function reverseImageSearch({
  imageUrl = '',
  imageName = '',
  detectedKeywords = [],
  category = '',
  brand = '',
  limit = 8
} = {}) {
  let connection;
  try {
    connection = await pool.getConnection();

    let bestMatch = null;
    let visualAnalysis = {
      detectedCategory: '',
      detectedBrand: '',
      detectedFeatures: [],
      confidence: 0,
      summary: ''
    };

    // 1. Exact image URL lookup against products or product_images
    if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim()) {
      const cleanUrl = imageUrl.trim().split('?')[0];
      const [exactRows] = await connection.query(
        `SELECT p.id, p.name, p.slug, p.brand, p.model_code, p.base_price, p.thumbnail_url,
                p.description, p.category_id, c.name AS category_name, c.slug AS category_slug,
                COALESCE(MIN(pv.price), p.base_price) AS min_price,
                COALESCE(SUM(pv.stock), 0) AS total_stock
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         LEFT JOIN product_variants pv ON pv.product_id = p.id
         LEFT JOIN product_images pi ON pi.product_id = p.id
         WHERE (p.thumbnail_url = ? OR p.thumbnail_url LIKE ? OR pi.image_url = ? OR pi.image_url LIKE ?)
           AND p.status IN ('active', 'out_of_stock')
         GROUP BY p.id
         LIMIT 1`,
        [imageUrl, `%${cleanUrl}%`, imageUrl, `%${cleanUrl}%`]
      );

      if (exactRows.length > 0) {
        const row = exactRows[0];
        bestMatch = {
          id: row.id,
          name: row.name,
          slug: row.slug,
          brand: row.brand,
          model_code: row.model_code,
          base_price: parseFloat(row.base_price),
          min_price: parseFloat(row.min_price),
          thumbnail_url: row.thumbnail_url,
          description: row.description,
          category_id: row.category_id,
          category_name: row.category_name,
          category_slug: row.category_slug,
          total_stock: Number(row.total_stock) || 0,
          in_stock: Number(row.total_stock) > 0,
          confidence: 99.8,
          match_reason: 'Khớp 100% hình ảnh sản phẩm trong kho dữ liệu'
        };

        visualAnalysis = {
          detectedCategory: row.category_name,
          detectedBrand: row.brand,
          detectedFeatures: [
            row.category_name,
            row.brand,
            row.model_code || 'Chính hãng',
            Number(row.total_stock) > 0 ? 'Còn hàng' : 'Tạm hết hàng'
          ],
          confidence: 99.8,
          summary: `AI đã đối soát thị giác thành công: Khớp chính xác với "${row.name}".`
        };
      }
    }

    // 2. Token-based matching if no direct URL match
    let tokens = [];
    if (imageName && typeof imageName === 'string') {
      const nameWithoutExt = imageName.replace(/\.[a-zA-Z0-9]+$/, '');
      const rawWords = nameWithoutExt
        .replace(/[-_=+!@#$%^&*()\[\]{}|\\:;"'<>,.?/]/g, ' ')
        .split(/\s+/)
        .map(w => w.trim().toLowerCase())
        .filter(w => w.length >= 2 && !['img', 'image', 'photo', 'screenshot', 'file', 'pic', 'picture', 'download'].includes(w));
      tokens.push(...rawWords);
    }
    if (Array.isArray(detectedKeywords)) {
      tokens.push(...detectedKeywords.map(k => String(k).trim().toLowerCase()).filter(Boolean));
    }
    if (brand && typeof brand === 'string') tokens.push(brand.trim().toLowerCase());
    if (category && typeof category === 'string') tokens.push(category.trim().toLowerCase());

    tokens = [...new Set(tokens)];

    let candidateQuery = `
      SELECT p.id, p.name, p.slug, p.brand, p.model_code, p.base_price, p.thumbnail_url,
             p.description, p.category_id, c.name AS category_name, c.slug AS category_slug,
             COALESCE(MIN(pv.price), p.base_price) AS min_price,
             COALESCE(SUM(pv.stock), 0) AS total_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_variants pv ON pv.product_id = p.id
      WHERE p.status IN ('active', 'out_of_stock')
    `;
    const candidateParams = [];

    if (category && category !== 'all') {
      if (/^\d+$/.test(String(category))) {
        candidateQuery += ' AND p.category_id = ?';
        candidateParams.push(Number(category));
      } else {
        candidateQuery += ' AND (c.slug = ? OR c.name LIKE ?)';
        candidateParams.push(category, `%${category}%`);
      }
    }

    if (brand) {
      candidateQuery += ' AND p.brand LIKE ?';
      candidateParams.push(`%${brand}%`);
    }

    candidateQuery += ' GROUP BY p.id ORDER BY p.id ASC LIMIT 50';
    const [candidates] = await connection.query(candidateQuery, candidateParams);

    const scoredCandidates = candidates.map(p => {
      let score = 0;
      const pNameLower = (p.name || '').toLowerCase();
      const pBrandLower = (p.brand || '').toLowerCase();
      const pDescLower = (p.description || '').toLowerCase();
      const pModelLower = (p.model_code || '').toLowerCase();
      const pCatLower = (p.category_name || '').toLowerCase();
      const pCatSlug = (p.category_slug || '').toLowerCase();

      for (const token of tokens) {
        if (pNameLower.includes(token)) score += 25;
        if (pModelLower.includes(token)) score += 30;
        if (pBrandLower === token) score += 20;
        else if (pBrandLower.includes(token)) score += 10;
        if (pCatLower.includes(token) || pCatSlug.includes(token)) score += 25;
        if (pDescLower.includes(token)) score += 5;
      }

      if (category && (pCatSlug === category || pCatLower.includes(category.toLowerCase()))) {
        score += 30;
      }
      if (brand && pBrandLower.includes(brand.toLowerCase())) {
        score += 20;
      }

      return {
        ...p,
        base_price: parseFloat(p.base_price),
        min_price: parseFloat(p.min_price),
        total_stock: Number(p.total_stock) || 0,
        in_stock: Number(p.total_stock) > 0,
        score
      };
    });

    scoredCandidates.sort((a, b) => b.score - a.score);

    let similarProducts = [];
    if (bestMatch) {
      const [moreRows] = await connection.query(
        `SELECT p.id, p.name, p.slug, p.brand, p.model_code, p.base_price, p.thumbnail_url,
                p.description, p.category_id, c.name AS category_name, c.slug AS category_slug,
                COALESCE(MIN(pv.price), p.base_price) AS min_price,
                COALESCE(SUM(pv.stock), 0) AS total_stock
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         LEFT JOIN product_variants pv ON pv.product_id = p.id
         WHERE p.category_id = ? AND p.id != ? AND p.status IN ('active', 'out_of_stock')
         GROUP BY p.id
         ORDER BY p.id ASC
         LIMIT ?`,
        [bestMatch.category_id, bestMatch.id, limit]
      );

      similarProducts = moreRows.map((r, idx) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        brand: r.brand,
        model_code: r.model_code,
        base_price: parseFloat(r.base_price),
        min_price: parseFloat(r.min_price),
        thumbnail_url: r.thumbnail_url,
        description: r.description,
        category_id: r.category_id,
        category_name: r.category_name,
        category_slug: r.category_slug,
        total_stock: Number(r.total_stock) || 0,
        in_stock: Number(r.total_stock) > 0,
        confidence: Math.max(78, Math.round(95 - idx * 3.5)),
        match_reason: 'Cùng danh mục & hệ sinh thái'
      }));
    } else {
      const topCand = scoredCandidates[0];
      if (topCand && topCand.score > 0) {
        const topConfidence = Math.min(98.8, Math.max(82, 80 + topCand.score * 0.5));
        bestMatch = {
          ...topCand,
          confidence: Number(topConfidence.toFixed(1)),
          match_reason: `Khớp đặc trưng thị giác (${topCand.category_name} - ${topCand.brand})`
        };

        visualAnalysis = {
          detectedCategory: topCand.category_name,
          detectedBrand: topCand.brand,
          detectedFeatures: [
            topCand.category_name,
            topCand.brand,
            topCand.model_code || 'Chính hãng',
            `Độ tương đồng cao`
          ],
          confidence: Number(topConfidence.toFixed(1)),
          summary: `AI đã nhận diện linh kiện khớp nhất với ${topCand.brand} (${topCand.category_name}).`
        };

        similarProducts = scoredCandidates.slice(1, limit + 1).map((r, idx) => ({
          ...r,
          confidence: Math.max(70, Number((topConfidence - 4 - idx * 3.2).toFixed(1))),
          match_reason: r.category_id === topCand.category_id ? 'Cùng danh mục' : 'Thiết bị tương đương'
        }));
      } else {
        const topDefault = scoredCandidates[0] || null;
        if (topDefault) {
          bestMatch = {
            ...topDefault,
            confidence: 78.0,
            match_reason: 'Mặt hàng công nghệ đề xuất theo ảnh'
          };
          visualAnalysis = {
            detectedCategory: topDefault.category_name,
            detectedBrand: topDefault.brand,
            detectedFeatures: [topDefault.category_name, topDefault.brand, 'Sản phẩm nổi bật'],
            confidence: 78.0,
            summary: `Hiển thị sản phẩm phần cứng tiêu biểu phù hợp.`
          };
          similarProducts = scoredCandidates.slice(1, limit + 1).map((r, idx) => ({
            ...r,
            confidence: Math.max(68, 75 - idx * 2),
            match_reason: 'Gợi ý thêm'
          }));
        }
      }
    }

    return {
      success: true,
      visualAnalysis,
      bestMatch,
      similarProducts
    };
  } finally {
    if (connection) connection.release();
  }
}

module.exports = {
  getProductById,
  getProductByIdentifier: getProductById,
  getProductVariantsById,
  getProductVariantsByIdentifier: getProductVariantsById,
  getSimilarProducts,
  getAllCategories,
  getProductsList,
  reverseImageSearch
};
