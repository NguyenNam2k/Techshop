function couponFailure(message) {
  return { valid: false, message };
}

function toDateOnlyString(dateVal) {
  if (!dateVal) return null;
  if (typeof dateVal === 'string') return dateVal.slice(0, 10);
  if (dateVal instanceof Date && !Number.isNaN(dateVal.getTime())) {
    const year = dateVal.getFullYear();
    const month = String(dateVal.getMonth() + 1).padStart(2, '0');
    const day = String(dateVal.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return String(dateVal).slice(0, 10);
}

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatViDate(dateStr) {
  const only = toDateOnlyString(dateStr);
  if (!only) return '';
  const [y, m, d] = only.split('-');
  return d && m && y ? `${d}/${m}/${y}` : only;
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

function evaluateCouponAvailability(coupon) {
  if (!coupon) {
    return couponFailure('Mã giảm giá không tồn tại trên hệ thống.');
  }
  if (!isCouponActive(coupon)) {
    return couponFailure('Mã giảm giá hiện đang tạm ngừng áp dụng.');
  }

  const today = getTodayDateString();
  const startStr = toDateOnlyString(coupon.start_date);
  const endStr = toDateOnlyString(coupon.end_date);

  if (startStr && today < startStr) {
    return couponFailure(`Mã giảm giá chỉ có hiệu lực từ ngày ${formatViDate(startStr)}.`);
  }
  if (endStr && today > endStr) {
    return couponFailure(`Mã giảm giá đã hết hạn sử dụng (HSD: ${formatViDate(endStr)}).`);
  }
  if (Number(coupon.usage_limit) > 0 && Number(coupon.used_count) >= Number(coupon.usage_limit)) {
    return couponFailure('Mã giảm giá đã hết lượt sử dụng.');
  }
  return { valid: true };
}

function evaluateCoupon(coupon, orderTotal) {
  const availability = evaluateCouponAvailability(coupon);
  if (!availability.valid) return availability;

  const total = Number(orderTotal);
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
  if (isPercent && maxDiscount !== null) {
    discountAmount = Math.min(discountAmount, maxDiscount);
  }

  return {
    valid: true,
    coupon: {
      ...coupon,
      discount_type: isPercent ? 'percentage' : 'fixed',
      discount_value: value,
      min_order_value: Number(coupon.min_order_value || 0),
      max_discount: maxDiscount,
      max_discount_amount: maxDiscount
    },
    discountAmount: Math.max(0, Math.min(total, discountAmount))
  };
}

async function hasCustomerUsedCoupon(connection, customerId, couponId) {
  if (!customerId || !couponId) return null;
  const [rows] = await connection.query(
    `SELECT used_at, used_order_code
     FROM customer_vouchers
     WHERE customer_id = ? AND coupon_id = ? AND used_at IS NOT NULL
     LIMIT 1`,
    [customerId, couponId]
  );
  return rows[0] || null;
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
  if (options.customerId && coupon) {
    const usedRecord = await hasCustomerUsedCoupon(connection, options.customerId, coupon.id);
    if (usedRecord) {
      return couponFailure(
        usedRecord.used_order_code
          ? `Bạn đã sử dụng mã giảm giá này cho đơn hàng ${usedRecord.used_order_code}.`
          : 'Bạn đã sử dụng mã giảm giá này trước đó.'
      );
    }
  }
  return evaluateCoupon(coupon, amount);
}

module.exports = {
  findCoupon,
  evaluateCouponAvailability,
  evaluateCoupon,
  validateCoupon,
  toDateOnlyString,
  getTodayDateString
};
