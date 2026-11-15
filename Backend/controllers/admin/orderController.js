const adminOrderService = require('../../services/admin/orderService');

/**
 * Controller Quản lý Đơn hàng cho Admin
 */
const adminOrderController = {
  /**
   * GET /api/admin/orders
   * Lấy danh sách đơn hàng có tìm kiếm, lọc, phân trang
   */
  getOrders: async (req, res) => {
    try {
      const {
        search,
        paymentMethod,
        paymentStatus,
        shippingStatus,
        startDate,
        endDate,
        page,
        limit,
        sortBy,
        sortOrder
      } = req.query;

      const result = await adminOrderService.getOrders({
        search,
        paymentMethod,
        paymentStatus,
        shippingStatus,
        startDate,
        endDate,
        page,
        limit,
        sortBy,
        sortOrder
      });

      return res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('[AdminOrderController.getOrders Error]:', error);
      return res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Lỗi khi tải danh sách đơn hàng!',
        error: error.message
      });
    }
  },

  /**
   * GET /api/admin/orders/:orderCode
   * Xem chi tiết một đơn hàng kèm danh sách sản phẩm
   */
  getOrderDetail: async (req, res) => {
    try {
      const { orderCode } = req.params;
      const order = await adminOrderService.getOrderDetail(orderCode);

      return res.status(200).json({
        success: true,
        data: order
      });
    } catch (error) {
      console.error('[AdminOrderController.getOrderDetail Error]:', error);
      return res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Lỗi khi tải chi tiết đơn hàng!',
        error: error.message
      });
    }
  },

  /**
   * PATCH /api/admin/orders/:orderCode/status
   * Cập nhật trạng thái giao hàng / thanh toán
   */
  updateOrderStatus: async (req, res) => {
    try {
      const { orderCode } = req.params;
      const { shippingStatus, paymentStatus } = req.body;

      const updatedOrder = await adminOrderService.updateOrderStatus(orderCode, {
        shippingStatus,
        paymentStatus
      });

      return res.status(200).json({
        success: true,
        message: `Đã cập nhật trạng thái đơn hàng #${orderCode} thành công!`,
        data: updatedOrder
      });
    } catch (error) {
      console.error('[AdminOrderController.updateOrderStatus Error]:', error);
      return res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Lỗi khi cập nhật trạng thái đơn hàng!',
        error: error.message
      });
    }
  }
};

module.exports = adminOrderController;
