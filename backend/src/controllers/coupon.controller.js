const pool = require('../config/database');
const couponService = require('../services/coupon.service');

async function getActiveCoupons(req, res) {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query(`
      SELECT *
      FROM coupons
      WHERE (start_date IS NULL OR start_date <= NOW())
        AND (end_date IS NULL OR end_date >= NOW())
        AND (usage_limit IS NULL OR usage_limit = 0 OR used_count < usage_limit)
      ORDER BY id ASC
    `);

    const activeCoupons = rows
      .filter(coupon => {
        if (coupon.status && coupon.status !== 'active') return false;
        if (coupon.is_active !== undefined && coupon.is_active !== null && Number(coupon.is_active) === 0) return false;
        return true;
      })
      .map(coupon => {
        const isPercent = coupon.discount_type === 'percent' || coupon.discount_type === 'percentage';
        const maxDiscount = coupon.max_discount ?? coupon.max_discount_amount ?? null;
        return {
          id: coupon.id,
          code: coupon.code,
          description: coupon.description || `Giảm ${isPercent ? `${Number(coupon.discount_value)}%` : `${Number(coupon.discount_value).toLocaleString('vi-VN')}₫`} cho đơn hàng`,
          terms_and_conditions: coupon.terms_and_conditions || null,
          discount_type: isPercent ? 'percent' : 'fixed',
          discount_value: Number(coupon.discount_value),
          min_order_value: Number(coupon.min_order_value || 0),
          max_discount: maxDiscount == null || Number(maxDiscount) <= 0 ? null : Number(maxDiscount),
          usage_limit: Number(coupon.usage_limit || 0),
          used_count: Number(coupon.used_count || 0),
          start_date: coupon.start_date,
          end_date: coupon.end_date
        };
      });

    return res.status(200).json({
      success: true,
      data: activeCoupons
    });
  } catch (error) {
    console.error('Error in getActiveCoupons:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể tải danh sách mã giảm giá.'
    });
  } finally {
    if (connection) connection.release();
  }
}

async function validateCoupon(req, res) {
  let connection;
  try {
    const { code, orderTotal } = req.body;
    connection = await pool.getConnection();
    const result = await couponService.validateCoupon(connection, code, orderTotal);
    if (!result.valid) {
      return res.status(400).json({
        success: true,
        valid: false,
        message: result.message
      });
    }

    const coupon = result.coupon;
    return res.status(200).json({
      success: true,
      valid: true,
      message: `Áp dụng mã ${coupon.code} thành công!`,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discount_type: coupon.discount_type,
        discount_value: Number(coupon.discount_value),
        min_order_value: Number(coupon.min_order_value || 0),
        max_discount: coupon.max_discount == null ? null : Number(coupon.max_discount),
        discount_amount: result.discountAmount
      }
    });
  } catch (error) {
    console.error('Error in validateCoupon:', error);
    return res.status(500).json({
      success: false,
      valid: false,
      message: 'Không thể kiểm tra mã giảm giá.'
    });
  } finally {
    if (connection) connection.release();
  }
}

module.exports = {
  getActiveCoupons,
  validateCoupon
};
