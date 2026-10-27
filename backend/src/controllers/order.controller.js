const orderService = require('../services/order.service');

async function createOrder(req, res) {
  try {
    const customerId = req.user?.role === 'customer' ? Number(req.user.id) : null;
    const result = await orderService.createOrder({
      customerId: Number.isInteger(customerId) && customerId > 0 ? customerId : null,
      sessionToken: req.headers['x-session-token'],
      recipientName: req.body.recipientName,
      recipientPhone: req.body.recipientPhone,
      shippingAddress: req.body.shippingAddress,
      provinceId: req.body.provinceId,
      wardId: req.body.wardId,
      paymentMethod: req.body.paymentMethod,
      orderNotes: req.body.orderNotes,
      couponCode: req.body.couponCode,
      items: req.body.items
    });
    return res.status(201).json({
      success: true,
      message: 'Đặt hàng thành công!',
      data: result
    });
  } catch (error) {
    console.error('Error in createOrder controller:', error);
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || 'Không thể tạo đơn hàng.'
    });
  }
}

async function getOrderDetail(req, res) {
  try {
    const orderCode = String(req.params.orderCode || '').trim();
    if (!orderCode) {
      return res.status(400).json({ success: false, message: 'Mã đơn hàng không hợp lệ.' });
    }
    const order = await orderService.getOrderByCode(orderCode);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng.' });
    }
    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error('Error in getOrderDetail controller:', error);
    return res.status(500).json({ success: false, message: 'Không thể tải thông tin đơn hàng.' });
  }
}

async function getOrdersList(req, res) {
  try {
    const customerId = req.user?.id || req.query.customerId;
    const sessionToken = req.headers['x-session-token'] || req.query.sessionToken;
    const phone = req.query.phone;
    const limit = Math.min(Number(req.query.limit) || 50, 100);

    const orders = await orderService.getAllOrders({
      customerId: customerId ? Number(customerId) : null,
      sessionToken,
      phone,
      limit
    });

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('Error in getOrdersList controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể tải danh sách đơn hàng.'
    });
  }
}

async function cancelUnpaidOrder(req, res) {
  try {
    const orderCode = String(req.params.orderCode || '').trim();
    if (!orderCode) {
      return res.status(400).json({ success: false, message: 'Mã đơn hàng không hợp lệ.' });
    }
    const result = await orderService.cancelUnpaidOrder(orderCode);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in cancelUnpaidOrder controller:', error);
    return res.status(500).json({ success: false, message: 'Lỗi khi hủy đơn hàng chưa thanh toán.' });
  }
}

module.exports = {
  cancelUnpaidOrder,
  createOrder,
  getOrderDetail,
  getOrdersList
};
