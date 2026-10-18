const ProductRepository = require('../repositories/ProductRepository');

const catalogService = {
  /**
   * Lấy danh sách sản phẩm với phân trang, bộ lọc và sắp xếp
   */
  getCatalog: async (queryParams) => {
    const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(queryParams.limit, 10) || 12));
    const sort = queryParams.sort || 'newest';

    const filterOptions = {
      page,
      limit,
      sort,
      category: queryParams.category || null,
      brands: queryParams.brands || null,
      minPrice: queryParams.minPrice || null,
      maxPrice: queryParams.maxPrice || null,
      inStock: queryParams.inStock !== undefined ? queryParams.inStock : null,
      search: queryParams.search || queryParams.q || null
    };

    // Chạy song song query lấy sản phẩm và query đếm tổng
    const [products, total] = await Promise.all([
      ProductRepository.findCatalog(filterOptions),
      ProductRepository.countCatalog(filterOptions)
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    // Chuẩn hóa dữ liệu trả về cho Front-end Card
    const formattedProducts = products.map((p) => {
      const minPrice = parseFloat(p.min_price || p.base_price);
      const maxPrice = parseFloat(p.max_price || p.base_price);
      const basePrice = parseFloat(p.base_price);
      const totalStock = parseInt(p.total_stock, 10) || 0;

      // Tính % giảm giá nếu minPrice thấp hơn basePrice
      let discountPercent = 0;
      if (basePrice > minPrice && basePrice > 0) {
        discountPercent = Math.round(((basePrice - minPrice) / basePrice) * 100);
      }

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        brand: p.brand,
        model_code: p.model_code,
        thumbnail_url: p.thumbnail_url,
        category: {
          id: p.category_id,
          name: p.category_name,
          slug: p.category_slug
        },
        pricing: {
          base_price: basePrice,
          min_price: minPrice,
          max_price: maxPrice,
          has_variants: minPrice !== maxPrice,
          discount_percent: discountPercent
        },
        inventory: {
          total_stock: totalStock,
          in_stock: totalStock > 0,
          status_label: totalStock > 0 ? 'Còn hàng' : 'Tạm hết hàng'
        },
        warranty_months: p.warranty_months,
        created_at: p.created_at
      };
    });

    return {
      products: formattedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      filtersApplied: {
        category: filterOptions.category,
        brands: filterOptions.brands ? (Array.isArray(filterOptions.brands) ? filterOptions.brands : String(filterOptions.brands).split(',')) : [],
        minPrice: filterOptions.minPrice ? parseFloat(filterOptions.minPrice) : null,
        maxPrice: filterOptions.maxPrice ? parseFloat(filterOptions.maxPrice) : null,
        inStock: filterOptions.inStock === 'true' || filterOptions.inStock === true,
        sort,
        search: filterOptions.search
      }
    };
  },

  /**
   * Lấy Metadata bộ lọc (Hãng, Danh mục, Khoảng giá)
   */
  getFilterMetadata: async (categorySlug) => {
    return await ProductRepository.getFilterMetadata(categorySlug);
  },

  /**
   * Lấy chi tiết 1 sản phẩm
   */
  getProductDetail: async (idOrSlug) => {
    const product = await ProductRepository.findByIdOrSlug(idOrSlug);
    if (!product) {
      throw { status: 404, message: 'Không tìm thấy sản phẩm yêu cầu!' };
    }
    return product;
  }
};

module.exports = catalogService;
