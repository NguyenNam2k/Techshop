const productService = require('../services/product.service');


async function getProductDetail(req, res) {
  try {
    const targetId = req.params.id || req.query.id || req.query.slug;

    if (!targetId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID or slug is required'
      });
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

module.exports = {
  getProductDetail,
  getProductVariants,
  getSimilarProducts
};