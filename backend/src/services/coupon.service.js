function couponFailure(message) {
  return { valid: false, message };
}

async function findCoupon(connection, code, { forUpdate = false } = {}) {
  const [rows] = await connection.query(
    `SELECT *
     FROM coupons
     WHERE UPPER(code) = ?
     LIMIT 1${forUpdate ? ' FOR UPDATE' : ''}`,
    [String(code || '').trim().toUpperCase()]
  );
  return rows[0] || null;
}

function isCouponActive(coupon) {
  if (!coupon) return false;
  if (coupon.status && coupon.status !== 'active') return false;
  if (coupon.is_active !== undefined && coupon.is_active !== null && Number(coupon.is_active) === 0) return false;
  return true;
}

function getMaxDiscount(coupon) {
  const raw = coupon.max_discount ?? coupon.max_discount_amount ?? null;
  if (raw === null || raw === undefined || Number(raw) <= 0) return null;
  return Number(raw);
}

function evaluateCoupon(coupon, orderTotal) {
  const total = Number(orderTotal);
  if (!isCouponActive(coupon)) {
    return couponFailure('Mã giảm giá không tồn tại hoặc không còn hiệu lực.');
  }
  if (coupon.start_date && new Date(coupon.start_date).getTime() > Date.now()) {
    return couponFailure('Mã giảm giá chưa bắt đầu có hiệu lực.');
  }
  if (coupon.end_date && new Date(coupon.end_date).getTime() < Date.now()) {
    return couponFailure('Mã giảm giá đã hết hạn sử dụng.');
  }
  if (Number(coupon.usage_limit) > 0 && Number(coupon.used_count) >= Number(coupon.usage_limit)) {
    return couponFailure('Mã giảm giá đã đạt giới hạn lượt sử dụng.');
  }
  if (total < Number(coupon.min_order_value || 0)) {
    return couponFailure(
      `Mã giảm giá chỉ áp dụng cho đơn hàng từ ${new Intl.NumberFormat('vi-VN').format(Number(coupon.min_order_value))}₫ trở lên.`
    );
  }

  const value = Number(coupon.discount_value);
  const isPercent = coupon.discount_type === 'percent' || coupon.discount_type === 'percentage';
  let discountAmount = isPercent
    ? Math.round((total * value) / 100)
    : Math.min(total, value);

  const maxDiscount = getMaxDiscount(coupon);
  if (maxDiscount !== null) {
    discountAmount = Math.min(discountAmount, maxDiscount);
  }

  return {
    valid: true,
    coupon: {
      ...coupon,
      discount_type: isPercent ? 'percent' : 'fixed',
      max_discount: maxDiscount
    },
    discountAmount: Math.max(0, Math.min(total, discountAmount))
  };
}

async function validateCoupon(connection, code, orderTotal, options = {}) {
  const amount = Number(orderTotal);
  if (!String(code || '').trim()) {
    return couponFailure('Vui lòng nhập mã giảm giá.');
  }
  if (!Number.isFinite(amount) || amount < 0) {
    return couponFailure('Giá trị đơn hàng không hợp lệ.');
  }

  const coupon = await findCoupon(connection, code, options);
  return evaluateCoupon(coupon, amount);
}

module.exports = {
  findCoupon,
  evaluateCoupon,
  validateCoupon
};
