const pool = require('../config/database');
const couponService = require('../services/coupon.service');

async function getActiveCoupons(req, res) {
  let connection;
  try {
    connection = await pool.getConnection();
    const customerId = req.user?.role === 'customer' ? Number(req.user.id) : null;

    const [rows] = await connection.query(`
      SELECT *
      FROM coupons
      WHERE is_active = 1
        AND (start_date IS NULL OR start_date <= CURDATE())
        AND (end_date IS NULL OR end_date >= CURDATE())
        AND (usage_limit IS NULL OR usage_limit = 0 OR used_count < usage_limit)
      ORDER BY discount_value DESC, id ASC
    `);

    let customerVoucherMap = new Map();
    if (customerId) {
      const [savedRows] = await connection.query(
        'SELECT coupon_id, saved_at, used_at, used_order_code FROM customer_vouchers WHERE customer_id = ?',
        [customerId]
      );
      customerVoucherMap = new Map(savedRows.map((r) => [Number(r.coupon_id), r]));
    }

    const activeCoupons = rows.map((coupon) => {
      const isPercent = coupon.discount_type === 'percent' || coupon.discount_type === 'percentage';
      const maxDiscount = coupon.max_discount ?? coupon.max_discount_amount ?? null;
      const savedMeta = customerVoucherMap.get(Number(coupon.id));
      const usageLimit = Number(coupon.usage_limit || 0);
      const usedCount = Number(coupon.used_count || 0);
      return {
        id: coupon.id,
        code: coupon.code,
        description:
          coupon.description ||
          `Giảm ${isPercent ? `${Number(coupon.discount_value)}%` : `${Number(coupon.discount_value).toLocaleString('vi-VN')}₫`} cho đơn hàng`,
        terms_and_conditions: coupon.terms_and_conditions || null,
        discount_type: isPercent ? 'percentage' : 'fixed',
        discount_value: Number(coupon.discount_value),
        min_order_value: Number(coupon.min_order_value || 0),
        max_discount: maxDiscount == null || Number(maxDiscount) <= 0 ? null : Number(maxDiscount),
        max_discount_amount: maxDiscount == null || Number(maxDiscount) <= 0 ? null : Number(maxDiscount),
        usage_limit: usageLimit,
        used_count: usedCount,
        remaining_uses: usageLimit > 0 ? Math.max(0, usageLimit - usedCount) : null,
        start_date: couponService.toDateOnlyString(coupon.start_date),
        end_date: couponService.toDateOnlyString(coupon.end_date),
        is_active: 1,
        is_saved: Boolean(savedMeta),
        is_used: Boolean(savedMeta?.used_at),
        used_order_code: savedMeta?.used_order_code || null
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
    const customerId = req.user?.role === 'customer' ? Number(req.user.id) : null;
    connection = await pool.getConnection();
    const result = await couponService.validateCoupon(connection, code, orderTotal, { customerId });
    if (!result.valid) {
      return res.status(400).json({
        success: false,
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
        max_discount_amount: coupon.max_discount_amount == null ? null : Number(coupon.max_discount_amount),
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
