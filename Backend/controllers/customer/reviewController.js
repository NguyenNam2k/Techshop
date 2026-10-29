const ReviewService = require('../../services/customer/reviewService');

class ReviewController {
  /**
   * GET /api/products/:id/reviews
   */
  static async getProductReviews(req, res) {
    try {
      const { id } = req.params;
      const { rating, page, limit } = req.query;

      const data = await ReviewService.getProductReviews(id, {
        rating,
        page,
        limit
      });

      return res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      console.error('[getProductReviews Error]:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Không thể tải danh sách đánh giá!'
      });
    }
  }

  /**
   * POST /api/products/:id/reviews
   */
  static async createProductReview(req, res) {
    try {
      const { id } = req.params;
      const { rating, comment, customer_name } = req.body;
      const customer_id = req.user?.id || req.user?.userId || null;
      const finalName = customer_name || req.user?.name || req.user?.full_name || 'Khách hàng TechShop';

      const created = await ReviewService.createReview({
        productIdOrSlug: id,
        customer_id,
        customer_name: finalName,
        rating,
        comment
      });

      return res.status(201).json({
        success: true,
        message: 'Cảm ơn bạn đã gửi đánh giá sản phẩm!',
        data: created
      });
    } catch (error) {
      console.error('[createProductReview Error]:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Gửi đánh giá thất bại!'
      });
    }
  }

  /**
   * POST /api/products/:id/reviews/:reviewId/like
   */
  static async likeProductReview(req, res) {
    try {
      const { reviewId } = req.params;
      const likes = await ReviewService.likeReview(reviewId);

      return res.status(200).json({
        success: true,
        data: { likes }
      });
    } catch (error) {
      console.error('[likeProductReview Error]:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Không thể thích đánh giá này!'
      });
    }
  }
}

module.exports = ReviewController;
