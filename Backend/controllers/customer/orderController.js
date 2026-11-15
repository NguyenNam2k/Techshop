const orderService = require('../../services/customer/orderService');
const cartService = require('../../services/customer/cartService');
const pool = require('../../config/db');

async function createOrder(req, res) {
  try {
    const customerId = req.user?.role === 'customer' ? Number(req.user.id) : null;
    const result = await orderService.createOrder({
      customerId: Number.isInteger(customerId) && customerId > 0 ? customerId : null,
      sessionToken: req.headers['x-session-token'],
      recipientName: req.body.recipientName,
      recipientPhone: req.body.recipientPhone,
      recipientEmail: req.body.recipientEmail,
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

    // Strict ownership verification when accessed by authenticated customer
    if (req.user?.role === 'customer' && Number(order.customer_id) !== Number(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xem đơn hàng này.' });
    }

    // Guest access verification via session token if guest order
    if (!req.user) {
      const sessionToken = String(req.headers['x-session-token'] || '').trim();
      const guestId = sessionToken ? await cartService.findGuestIdBySession(pool, sessionToken) : null;
      if (order.guest_id && guestId !== order.guest_id) {
        return res.status(403).json({ success: false, message: 'Không thể xác thực quyền truy cập đơn hàng.' });
      }
    }

    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error('Error in getOrderDetail controller:', error);
    return res.status(500).json({ success: false, message: 'Không thể tải thông tin đơn hàng.' });
  }
}

async function getOrdersList(req, res) {
  try {
    const customerId = req.user?.role === 'customer' ? Number(req.user.id) : null;
    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập tài khoản khách hàng để xem đơn hàng.'
      });
    }

    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const orders = await orderService.getAllOrders({
      customerId,
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

async function cancelOrder(req, res) {
  try {
    const customerId = req.user?.role === 'customer' ? Number(req.user.id) : null;
    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập tài khoản khách hàng.'
      });
    }

    const orderCode = String(req.params.orderCode || '').trim();
    const reason = req.body?.reason || '';
    const updatedOrder = await orderService.cancelCustomerOrder(customerId, orderCode, reason);

    return res.status(200).json({
      success: true,
      message: `Đã hủy đơn hàng ${orderCode} và hoàn trả tồn kho thành công.`,
      data: updatedOrder
    });
  } catch (error) {
    console.error('Error in cancelOrder controller:', error);
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || 'Không thể hủy đơn hàng.'
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

async function requestCancellation(req, res) {
  try {
    const result = await orderService.requestOrderCancellation(
      req.user?.role === 'customer' ? req.user.id : null,
      req.params.orderCode,
      req.body?.reason
    );
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return res.status(error.statusCode || 400).json({ success: false, message: error.message });
  }
}

async function requestReturn(req, res) {
  try {
    const result = await orderService.requestReturn(
      req.user?.role === 'customer' ? req.user.id : null,
      req.params.orderCode,
      req.body?.reason
    );
    return res.status(201).json(result);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ success: false, message: error.message });
  }
}

async function updateStatus(req, res) {
  try {
    const result = await orderService.updateOrderStatus(
      req.params.orderCode,
      req.body?.shippingStatus
    );
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(error.statusCode || 400).json({ success: false, message: error.message });
  }
}

async function confirmCustomerDecision(req, res) {
  try {
    const customerId = req.user?.role === 'customer' ? req.user.id : null;
    const result = await orderService.confirmCustomerDecision(
      customerId,
      req.params.orderCode,
      req.body?.decision
    );
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(error.statusCode || 400).json({ success: false, message: error.message });
  }
}

module.exports = {
  cancelUnpaidOrder,
  requestCancellation,
  requestReturn,
  updateStatus,
  confirmCustomerDecision,
  createOrder,
  getOrderDetail,
  getOrdersList,
  cancelOrder
};
