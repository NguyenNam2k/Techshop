const CouponRepository = require('../repositories/couponRepository');

/**
 * Coupon Service
 * Enforces business rules, validations, and logic for coupons
 */
class CouponService {
  /**
   * Get all coupons with filters and summary stats
   */
  static async getCoupons(filters = {}) {
    const coupons = await CouponRepository.findAll(filters);
    const stats = await CouponRepository.getStats();
    return { coupons, stats };
  }

  /**
   * Get coupon by ID
   */
  static async getCouponById(id) {
    const coupon = await CouponRepository.findById(id);
    if (!coupon) {
      throw new Error(`Không tìm thấy mã giảm giá với ID #${id}`);
    }
    return coupon;
  }

  /**
   * Create a new coupon with validations
   */
  static async createCoupon(data) {
    if (!data.code || !data.code.trim()) {
      throw new Error('Mã giảm giá (Code) là bắt buộc');
    }

    const cleanCode = data.code.toUpperCase().trim();
    const existing = await CouponRepository.findByCode(cleanCode);
    if (existing) {
      throw new Error(`Mã giảm giá "${cleanCode}" đã tồn tại trên hệ thống`);
    }

    const discountVal = parseFloat(data.discount_value);
    if (isNaN(discountVal) || discountVal <= 0) {
      throw new Error('Giá trị giảm giá phải lớn hơn 0');
    }

    if (data.discount_type === 'percentage' && discountVal > 100) {
      throw new Error('Giảm giá phần trăm không được vượt quá 100%');
    }

    if (!data.start_date || !data.end_date) {
      throw new Error('Ngày bắt đầu và ngày kết thúc là bắt buộc');
    }

    if (new Date(data.start_date) > new Date(data.end_date)) {
      throw new Error('Ngày kết thúc phải sau hoặc bằng ngày bắt đầu');
    }

    const newId = await CouponRepository.create({
      ...data,
      code: cleanCode
    });

    return await CouponRepository.findById(newId);
  }

  /**
   * Update an existing coupon
   */
  static async updateCoupon(id, data) {
    const existing = await CouponRepository.findById(id);
    if (!existing) {
      throw new Error(`Không tìm thấy mã giảm giá với ID #${id}`);
    }

    if (data.code && data.code.toUpperCase().trim() !== existing.code) {
      const codeCheck = await CouponRepository.findByCode(data.code.toUpperCase().trim());
      if (codeCheck && codeCheck.id !== parseInt(id, 10)) {
        throw new Error(`Mã giảm giá "${data.code}" đã được sử dụng`);
      }
    }

    if (data.discount_value !== undefined) {
      const val = parseFloat(data.discount_value);
      if (isNaN(val) || val <= 0) {
        throw new Error('Giá trị giảm giá phải lớn hơn 0');
      }
      const type = data.discount_type || existing.discount_type;
      if (type === 'percentage' && val > 100) {
        throw new Error('Giảm giá phần trăm không được vượt quá 100%');
      }
    }

    if (data.start_date && data.end_date) {
      if (new Date(data.start_date) > new Date(data.end_date)) {
        throw new Error('Ngày kết thúc phải sau hoặc bằng ngày bắt đầu');
      }
    }

    await CouponRepository.update(id, data);
    return await CouponRepository.findById(id);
  }

  /**
   * Toggle active state
   */
  static async toggleStatus(id) {
    const existing = await CouponRepository.findById(id);
    if (!existing) {
      throw new Error(`Không tìm thấy mã giảm giá với ID #${id}`);
    }
    await CouponRepository.toggleStatus(id);
    return await CouponRepository.findById(id);
  }

  /**
   * Delete coupon
   */
  static async deleteCoupon(id) {
    const existing = await CouponRepository.findById(id);
    if (!existing) {
      throw new Error(`Không tìm thấy mã giảm giá với ID #${id}`);
    }
    if (existing.used_count > 0) {
      // If already used in orders, soft delete by disabling
      await CouponRepository.update(id, { is_active: 0 });
      return { softDeleted: true, message: 'Mã đã được dùng trong đơn hàng, đã chuyển sang trạng thái Ngừng kích hoạt' };
    }
    await CouponRepository.delete(id);
    return { softDeleted: false, message: 'Đã xóa mã giảm giá thành công' };
  }
}

module.exports = CouponService;
