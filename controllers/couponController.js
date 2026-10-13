const CouponService = require('../services/couponService');

/**
 * Coupon Controller
 * Handles HTTP requests for Coupon management
 */
class CouponController {
  /**
   * GET /api/coupons - Danh sách mã giảm giá
   */
  static async getCoupons(req, res, next) {
    try {
      const search = req.query.search || '';
      const is_active = req.query.is_active || 'all';
      const limit = parseInt(req.query.limit, 10) || 50;

      const result = await CouponService.getCoupons({ search, is_active, limit });
      return res.status(200).json({
        success: true,
        data: result.coupons,
        stats: result.stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/coupons/:id - Chi tiết 1 mã giảm giá
   */
  static async getCoupon(req, res, next) {
    try {
      const coupon = await CouponService.getCouponById(req.params.id);
      return res.status(200).json({
        success: true,
        data: coupon
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/coupons - Tạo mới mã giảm giá
   */
  static async createCoupon(req, res, next) {
    try {
      const newCoupon = await CouponService.createCoupon(req.body);
      return res.status(201).json({
        success: true,
        message: `Tạo mã giảm giá "${newCoupon.code}" thành công!`,
        data: newCoupon
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * PUT /api/coupons/:id - Cập nhật mã giảm giá
   */
  static async updateCoupon(req, res, next) {
    try {
      const updated = await CouponService.updateCoupon(req.params.id, req.body);
      return res.status(200).json({
        success: true,
        message: `Cập nhật mã giảm giá "${updated.code}" thành công!`,
        data: updated
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * PATCH /api/coupons/:id/toggle - Bật/tắt trạng thái kích hoạt
   */
  static async toggleStatus(req, res, next) {
    try {
      const coupon = await CouponService.toggleStatus(req.params.id);
      return res.status(200).json({
        success: true,
        message: `Mã "${coupon.code}" đã được ${coupon.is_active ? 'kích hoạt' : 'tạm dừng'}`,
        data: coupon
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/coupons/:id - Xóa mã giảm giá
   */
  static async deleteCoupon(req, res, next) {
    try {
      const result = await CouponService.deleteCoupon(req.params.id);
      return res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = CouponController;
