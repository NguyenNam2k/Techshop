const productService = require('../services/product.service');

async function getProducts(req, res) {
  try {
    const { id, slug, category, category_id, search, brand, sort, limit, page } = req.query;

    if (id || slug) {
      const productData = await productService.getProductById(id || slug);
      if (!productData) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      return res.status(200).json({ success: true, data: productData });
    }

    const result = await productService.getProductsList({
      category: category || category_id,
      search,
      brand,
      sort,
      limit,
      page
    });

    return res.status(200).json({
      success: true,
      total: result.total,
      page: result.page,
      limit: result.limit,
      data: result.products,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit) || 1
      }
    });
  } catch (error) {
    console.error('Error in getProducts controller:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function getProductDetail(req, res) {
  try {
    const targetId = req.params.id || req.query.id || req.query.slug;
    if (!targetId) {
      return getProducts(req, res);
    }
    const productData = await productService.getProductById(targetId);
    if (!productData) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: productData
    });
  } catch (error) {
    console.error('Error in getProductDetail controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

async function getProductVariants(req, res) {
  try {
    const { id } = req.params;
    const variantsData = await productService.getProductVariantsById(id);

    if (!variantsData) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: variantsData
    });
  } catch (error) {
    console.error('Error in getProductVariants controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

async function getSimilarProducts(req, res) {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit, 10) || 8;
    const similarProducts = await productService.getSimilarProducts(id, limit);

    return res.status(200).json({
      success: true,
      count: similarProducts.length,
      data: similarProducts
    });
  } catch (error) {
    console.error('Error in getSimilarProducts controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

async function getCategories(req, res) {
  try {
    const categories = await productService.getAllCategories();
    return res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error in getCategories controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

async function reverseImageSearch(req, res) {
  try {
    const {
      imageUrl,
      imageName,
      detectedKeywords,
      category,
      brand,
      limit
    } = req.method === 'POST' ? req.body : req.query;

    const result = await productService.reverseImageSearch({
      imageUrl,
      imageName,
      detectedKeywords,
      category,
      brand,
      limit: parseInt(limit, 10) || 8
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in reverseImageSearch controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi tìm kiếm bằng hình ảnh'
    });
  }
}

module.exports = {
  getProducts,
  getProductDetail,
  getProductVariants,
  getSimilarProducts,
  getCategories,
  reverseImageSearch
};