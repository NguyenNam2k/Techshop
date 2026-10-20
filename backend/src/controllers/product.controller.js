const productService = require('../services/product.service');

async function getProducts(req, res) {
  try {
    const { id, slug, category, search, brand, sort, limit, page } = req.query;

    // If id or slug is specifically requested in query, return detail
    if (id || slug) {
      const productData = await productService.getProductById(id || slug);
      if (!productData) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      return res.status(200).json({ success: true, data: productData });
    }

    const result = await productService.getProductsList({
      category,
      search,
      brand,
      sort,
      limit,
      page
    });

    res.status(200).json({
      success: true,
      total: result.total,
      page: result.page,
      limit: result.limit,
      data: result.products
    });
  } catch (error) {
    console.error('Error in getProducts controller:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
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

    res.status(200).json({
      success: true,
      data: productData
    });
  } catch (error) {
    console.error('Error in getProductDetail controller:', error);
    res.status(500).json({
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

    res.status(200).json({
      success: true,
      data: variantsData
    });
  } catch (error) {
    console.error('Error in getProductVariants controller:', error);
    res.status(500).json({
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

    res.status(200).json({
      success: true,
      count: similarProducts.length,
      data: similarProducts
    });
  } catch (error) {
    console.error('Error in getSimilarProducts controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

async function getCategories(req, res) {
  try {
    const categories = await productService.getAllCategories();
    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error in getCategories controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

async function getProductReviews(req, res) {
  try {
    const { id } = req.params;
    const data = await productService.getProductReviews(id);
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error in getProductReviews controller:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi tải đánh giá sản phẩm'
    });
  }
}

async function createProductReview(req, res) {
  try {
    const { id } = req.params;
    const { customer_name, rating, comment } = req.body;
    if (!rating) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn số sao đánh giá' });
    }
    const review = await productService.addProductReview(id, { customer_name, rating, comment });
    res.status(201).json({
      success: true,
      message: 'Cảm ơn bạn đã gửi đánh giá!',
      data: review
    });
  } catch (error) {
    console.error('Error in createProductReview controller:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi gửi đánh giá sản phẩm'
    });
  }
}

module.exports = {
  getProducts,
  getProductDetail,
  getProductVariants,
  getSimilarProducts,
  getCategories,
  getProductReviews,
  createProductReview
};