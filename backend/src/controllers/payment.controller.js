const pool = require('../config/database');

const ORDER_CODE_REGEX = /ORD[\s-]*(\d{13})[\s-]*(\d{4})/i;

function extractOrderCode(content) {
  const match = String(content || '').match(ORDER_CODE_REGEX);
  return match ? `ORD-${match[1]}-${match[2]}` : null;
}

function isLoopback(req) {
  const ip = String(req.ip || req.socket?.remoteAddress || '');
  return ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1';
}

// Webhook nhận biến động số dư từ cổng ngân hàng (tương thích SePay / Casso).
// Bảo mật: header "Authorization: Apikey <PAYMENT_WEBHOOK_KEY>".
// Nếu chưa cấu hình PAYMENT_WEBHOOK_KEY thì chỉ chấp nhận request từ localhost (dev).
async function bankWebhook(req, res) {
  try {
    const expectedKey = String(process.env.PAYMENT_WEBHOOK_KEY || '').trim();
    if (expectedKey) {
      const header = String(req.headers.authorization || '');
      const provided = header.replace(/^(Apikey|Bearer)\s+/i, '').trim();
      if (provided !== expectedKey) {
        return res.status(401).json({ success: false, message: 'Invalid webhook key.' });
      }
    } else if (!isLoopback(req)) {
      return res.status(403).json({ success: false, message: 'Webhook key is not configured.' });
    }

    const body = req.body || {};
    const transferType = String(body.transferType || 'in').toLowerCase();
    if (transferType !== 'in') {
      return res.status(200).json({ success: true, message: 'Ignored non-incoming transfer.' });
    }

    const amount = Number(body.transferAmount ?? body.amount ?? 0);
    const orderCode = extractOrderCode(body.content || body.description || body.code);
    if (!orderCode) {
      return res.status(200).json({ success: true, message: 'No order code in transfer content.' });
    }

    const [rows] = await pool.query(
      'SELECT id, final_amount, payment_method, payment_status FROM orders WHERE order_code = ? LIMIT 1',
      [orderCode]
    );
    const order = rows[0];
    if (!order || order.payment_method !== 'vietqr_banking') {
      return res.status(200).json({ success: true, message: 'Order not found or not a VietQR order.' });
    }
    if (order.payment_status === 'paid') {
      return res.status(200).json({ success: true, message: 'Order already paid.' });
    }
    if (amount < Number(order.final_amount)) {
      return res.status(200).json({ success: true, message: 'Transfer amount is less than order total.' });
    }

    await pool.query(
      "UPDATE orders SET payment_status = 'paid', updated_at = NOW() WHERE id = ? AND payment_status = 'unpaid'",
      [order.id]
    );
    return res.status(200).json({ success: true, message: `Order ${orderCode} marked as paid.` });
  } catch (error) {
    console.error('Error in bankWebhook:', error);
    return res.status(500).json({ success: false, message: 'Webhook processing failed.' });
  }
}

async function getPaymentStatus(req, res) {
  try {
    const orderCode = String(req.params.orderCode || '').trim();
    const [rows] = await pool.query(
      'SELECT payment_status, payment_method FROM orders WHERE order_code = ? LIMIT 1',
      [orderCode]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng.' });
    }
    return res.status(200).json({
      success: true,
      data: {
        orderCode,
        paymentMethod: rows[0].payment_method,
        paymentStatus: rows[0].payment_status,
        paid: rows[0].payment_status === 'paid'
      }
    });
  } catch (error) {
    console.error('Error in getPaymentStatus:', error);
    return res.status(500).json({ success: false, message: 'Không thể kiểm tra trạng thái thanh toán.' });
  }
}

async function simulatePayment(req, res) {
  try {
    const orderCode = String(req.body?.orderCode || req.query?.orderCode || '').trim();
    if (!orderCode) {
      return res.status(400).json({ success: false, message: 'Thiếu mã đơn hàng để giả lập thanh toán.' });
    }

    const [rows] = await pool.query(
      'SELECT id, final_amount, payment_method, payment_status FROM orders WHERE order_code = ? LIMIT 1',
      [orderCode]
    );
    const order = rows[0];
    if (!order) {
      return res.status(404).json({ success: false, message: `Không tìm thấy đơn hàng ${orderCode}.` });
    }

    await pool.query(
      "UPDATE orders SET payment_status = 'paid', updated_at = NOW() WHERE id = ?",
      [order.id]
    );

    return res.status(200).json({
      success: true,
      message: `[DEV/TEST] Đã xác nhận giả lập thanh toán thành công cho đơn hàng ${orderCode}.`,
      data: {
        orderCode,
        paymentStatus: 'paid',
        paid: true
      }
    });
  } catch (error) {
    console.error('Error in simulatePayment:', error);
    return res.status(500).json({ success: false, message: 'Không thể giả lập thanh toán.' });
  }
}

module.exports = { bankWebhook, getPaymentStatus, simulatePayment, extractOrderCode };
