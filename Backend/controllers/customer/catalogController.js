const catalogService = require('../../services/customer/catalogService');

/**
 * Controller cho Catalog & Storefront Products
 */
const catalogController = {
  /**
   * GET /api/catalog
   * Lấy danh sách sản phẩm có phân trang, lọc đa tiêu chí và sắp xếp
   */
  getCatalog: async (req, res) => {
    try {
      const data = await catalogService.getCatalog(req.query);
      return res.status(200).json({
        success: true,
        ...data
      });
    } catch (error) {
      console.error('[GetCatalog Error]:', error);
      const status = error.status || 500;
      return res.status(status).json({
        success: false,
        message: error.message || 'Lỗi khi tải danh mục sản phẩm!',
        error: error.error || error.message
      });
    }
  },

  /**
   * GET /api/catalog/filters-meta
   * Lấy metadata cho bộ lọc (danh mục, hãng, min-max price)
   */
  getFiltersMeta: async (req, res) => {
    try {
      const { category } = req.query;
      const metadata = await catalogService.getFilterMetadata(category);
      return res.status(200).json({
        success: true,
        metadata
      });
    } catch (error) {
      console.error('[GetFiltersMeta Error]:', error);
      const status = error.status || 500;
      return res.status(status).json({
        success: false,
        message: error.message || 'Lỗi khi lấy thông tin bộ lọc!',
        error: error.error || error.message
      });
    }
  },

  /**
   * GET /api/catalog/:idOrSlug
   * Lấy chi tiết 1 sản phẩm kèm biến thể, ảnh, thông số kỹ thuật
   */
  getProductDetail: async (req, res) => {
    try {
      const { idOrSlug } = req.params;
      const product = await catalogService.getProductDetail(idOrSlug);
      return res.status(200).json({
        success: true,
        product
      });
    } catch (error) {
      console.error('[GetProductDetail Error]:', error);
      const status = error.status || 500;
      return res.status(status).json({
        success: false,
        message: error.message || 'Lỗi khi lấy chi tiết sản phẩm!',
        error: error.error || error.message
      });
    }
  }
};

module.exports = catalogController;
