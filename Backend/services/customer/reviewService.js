const { pool } = require('../../config/database');

class ReviewService {
  /**
   * Resolve numeric product ID from ID or Slug
   */
  static async resolveProductId(productIdOrSlug) {
    const isNumeric = /^\d+$/.test(String(productIdOrSlug).trim());
    if (isNumeric) return parseInt(productIdOrSlug, 10);

    const [rows] = await pool.query(
      'SELECT id FROM products WHERE slug = ? OR id = ? LIMIT 1',
      [productIdOrSlug, productIdOrSlug]
    );
    return rows.length > 0 ? rows[0].id : null;
  }

  /**
   * Get reviews for a product with statistics
   */
  static async getProductReviews(productIdOrSlug, { rating = null, page = 1, limit = 10 } = {}) {
    const productId = await this.resolveProductId(productIdOrSlug);
    if (!productId) {
      return {
        reviews: [],
        pagination: { page: 1, limit, total: 0, totalPages: 0 },
        summary: {
          total_reviews: 0,
          average_rating: 5.0,
          star_counts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        }
      };
    }

    // 1. Calculate overall summary statistics
    const [summaryRows] = await pool.query(
      `SELECT 
         COUNT(*) AS total_reviews,
         COALESCE(AVG(rating), 5.0) AS average_rating,
         SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) AS star_5,
         SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) AS star_4,
         SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) AS star_3,
         SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) AS star_2,
         SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) AS star_1
       FROM reviews
       WHERE product_id = ? AND status = 'approved'`,
      [productId]
    );

    const stat = summaryRows[0] || {};
    const totalReviews = Number(stat.total_reviews) || 0;
    const avgRating = Number(stat.average_rating) || 5.0;

    // 2. Fetch reviews with optional rating filter and pagination
    let filterSql = 'WHERE product_id = ? AND status = "approved"';
    const params = [productId];

    if (rating && Number(rating) >= 1 && Number(rating) <= 5) {
      filterSql += ' AND rating = ?';
      params.push(parseInt(rating, 10));
    }

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS filtered_total FROM reviews ${filterSql}`,
      params
    );
    const filteredTotal = Number(countRows[0]?.filtered_total) || 0;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const listQuery = `
      SELECT 
        id, product_id, customer_id, customer_name,
        rating, comment, is_verified_buyer, likes,
        created_at
      FROM reviews
      ${filterSql}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `;
    const [reviews] = await pool.query(listQuery, [...params, limitNum, offset]);

    return {
      reviews: reviews.map((r) => ({
        id: r.id,
        product_id: r.product_id,
        customer_id: r.customer_id,
        customer_name: r.customer_name || 'Khách hàng TechShop',
        rating: Number(r.rating),
        comment: r.comment || '',
        is_verified_buyer: Boolean(r.is_verified_buyer),
        likes: Number(r.likes) || 0,
        created_at: r.created_at
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredTotal,
        totalPages: Math.ceil(filteredTotal / limitNum)
      },
      summary: {
        total_reviews: totalReviews,
        average_rating: parseFloat(avgRating.toFixed(1)),
        star_counts: {
          5: Number(stat.star_5) || 0,
          4: Number(stat.star_4) || 0,
          3: Number(stat.star_3) || 0,
          2: Number(stat.star_2) || 0,
          1: Number(stat.star_1) || 0
        }
      }
    };
  }

  /**
   * Submit a new customer review
   */
  static async createReview({ productIdOrSlug, customer_id = null, customer_name, rating, comment }) {
    const productId = await this.resolveProductId(productIdOrSlug);
    if (!productId) {
      throw new Error('Sản phẩm không tồn tại!');
    }

    const rate = parseInt(rating, 10);
    if (!rate || rate < 1 || rate > 5) {
      throw new Error('Số sao đánh giá phải từ 1 đến 5 sao.');
    }

    const trimmedComment = (comment || '').trim();
    if (!trimmedComment || trimmedComment.length < 5) {
      throw new Error('Nội dung đánh giá cần ít nhất 5 ký tự để hữu ích cho cộng đồng.');
    }

    const cleanName = (customer_name || '').trim() || 'Khách hàng BleenTechGear';

    const insertQuery = `
      INSERT INTO reviews (product_id, customer_id, customer_name, rating, comment, is_verified_buyer, likes, status)
      VALUES (?, ?, ?, ?, ?, 1, 0, 'approved')
    `;
    const [result] = await pool.query(insertQuery, [
      productId,
      customer_id || null,
      cleanName,
      rate,
      trimmedComment
    ]);

    return {
      id: result.insertId,
      product_id: productId,
      customer_id: customer_id || null,
      customer_name: cleanName,
      rating: rate,
      comment: trimmedComment,
      is_verified_buyer: true,
      likes: 0,
      created_at: new Date()
    };
  }

  /**
   * Like a review (Helpful feedback)
   */
  static async likeReview(reviewId) {
    const id = parseInt(reviewId, 10);
    if (!id) throw new Error('ID đánh giá không hợp lệ.');

    await pool.query('UPDATE reviews SET likes = likes + 1 WHERE id = ?', [id]);
    const [rows] = await pool.query('SELECT likes FROM reviews WHERE id = ?', [id]);
    return rows.length > 0 ? rows[0].likes : 0;
  }
}

module.exports = ReviewService;
