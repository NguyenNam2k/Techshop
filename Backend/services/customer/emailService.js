const nodemailer = require('nodemailer');
const pool = require('../../config/db');

// Khởi tạo Transporter cho Nodemailer
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const user = String(process.env.SMTP_USER || process.env.EMAIL_USER || '').trim();
  const rawPass = String(process.env.SMTP_PASS || process.env.EMAIL_PASS || '').trim();
  const pass = rawPass.replace(/\s+/g, '');

  if (user && pass) {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    if (host.includes('gmail')) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass }
      });
    } else {
      const port = Number(process.env.SMTP_PORT) || 587;
      const secure = process.env.SMTP_SECURE === 'true' || port === 465;
      transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass }
      });
    }
  } else {
    // Không có cấu hình SMTP -> null (chế độ Dev Simulator)
    transporter = null;
  }
  return transporter;
}

function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount || 0));
}

/**
 * Tạo nội dung HTML Email Xác Nhận Thanh Toán Đơn Hàng TechShop
 */
function buildPaymentSuccessHtml({ order, items, targetEmail }) {
  const itemsHtml = (items || []).map((item, index) => {
    return `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px 8px; font-size: 14px; color: #1e293b;">
          <strong>${index + 1}. ${item.product_name}</strong>
          ${item.variant_name ? `<br/><span style="font-size: 12px; color: #64748b;">Quy cách: ${item.variant_name}</span>` : ''}
          ${item.sku ? `<br/><span style="font-size: 11px; color: #94a3b8; font-family: monospace;">SKU: ${item.sku}</span>` : ''}
        </td>
        <td style="padding: 12px 8px; text-align: center; font-size: 14px; color: #1e293b;">${item.quantity}</td>
        <td style="padding: 12px 8px; text-align: right; font-size: 14px; color: #1e293b;">${formatVND(item.unit_price)}</td>
        <td style="padding: 12px 8px; text-align: right; font-size: 14px; font-weight: bold; color: #0284c7;">${formatVND(item.subtotal)}</td>
      </tr>
    `;
  }).join('');

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Xác nhận thanh toán đơn hàng #${order.order_code}</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px 12px;">
    <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
      
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">TECHSHOP VIỆT NAM</h1>
        <p style="margin: 6px 0 0; font-size: 14px; color: #e0f2fe;">Hệ thống bán lẻ thiết bị công nghệ & Gaming Gears chính hãng</p>
        <div style="display: inline-block; margin-top: 16px; background-color: #10b981; color: #ffffff; font-size: 12px; font-weight: 700; text-transform: uppercase; padding: 6px 16px; rounded: 9999px; border-radius: 20px; letter-spacing: 0.5px;">
          ✓ ĐÃ THANH TOÁN THÀNH CÔNG
        </div>
      </div>

      <!-- Lời chào & Tóm tắt -->
      <div style="padding: 24px;">
        <p style="font-size: 15px; color: #334155; line-height: 1.6; margin-top: 0;">
          Xin chào <strong>${order.recipient_name || 'Quý khách'}</strong>,
        </p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">
          TechShop xin chân thành cảm ơn Quý khách! Đơn hàng của Quý khách đã được xác nhận thanh toán thành công và hiện đang được chuyển sang bộ phận kho để đóng gói chuẩn bị giao tới Quý khách.
        </p>

        <!-- Khung tóm tắt đơn hàng -->
        <div style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; padding: 16px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Mã đơn hàng:</td>
              <td style="padding: 4px 0; text-align: right; font-weight: bold; color: #0284c7; font-family: monospace;">${order.order_code}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Thời gian thanh toán:</td>
              <td style="padding: 4px 0; text-align: right; color: #1e293b;">${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Phương thức thanh toán:</td>
              <td style="padding: 4px 0; text-align: right; color: #1e293b; font-weight: 600;">
                ${order.payment_method === 'vietqr_banking' ? 'Chuyển khoản QR Napas 24/7' : 'Thanh toán khi nhận hàng (COD)'}
              </td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Trạng thái thanh toán:</td>
              <td style="padding: 4px 0; text-align: right; color: #059669; font-weight: bold;">ĐÃ THANH TOÁN (PAID)</td>
            </tr>
          </table>
        </div>

        <!-- Bảng chi tiết sản phẩm -->
        <h3 style="font-size: 15px; color: #0f172a; margin: 24px 0 12px; font-weight: 700;">Chi tiết sản phẩm đã đặt:</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
              <th style="padding: 10px 8px; text-align: left; font-size: 12px; color: #475569; text-transform: uppercase;">Sản phẩm</th>
              <th style="padding: 10px 8px; text-align: center; font-size: 12px; color: #475569; text-transform: uppercase; width: 45px;">SL</th>
              <th style="padding: 10px 8px; text-align: right; font-size: 12px; color: #475569; text-transform: uppercase;">Đơn giá</th>
              <th style="padding: 10px 8px; text-align: right; font-size: 12px; color: #475569; text-transform: uppercase;">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <!-- Khung tổng kết thanh toán -->
        <div style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; padding: 16px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Tạm tính tiền hàng:</td>
              <td style="padding: 4px 0; text-align: right; color: #1e293b;">${formatVND(order.total_amount)}</td>
            </tr>
            ${Number(order.discount_amount) > 0 ? `
              <tr>
                <td style="padding: 4px 0; color: #059669;">Giảm giá Voucher:</td>
                <td style="padding: 4px 0; text-align: right; color: #059669; font-weight: bold;">-${formatVND(order.discount_amount)}</td>
              </tr>
            ` : ''}
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Phí vận chuyển:</td>
              <td style="padding: 4px 0; text-align: right; color: #1e293b;">
                ${Number(order.shipping_fee) === 0 ? 'Miễn phí (0₫)' : formatVND(order.shipping_fee)}
              </td>
            </tr>
            <tr style="border-top: 1px solid #cbd5e1;">
              <td style="padding: 10px 0 4px; font-size: 15px; font-weight: bold; color: #0f172a;">TỔNG THANH TOÁN:</td>
              <td style="padding: 10px 0 4px; text-align: right; font-size: 18px; font-weight: 800; color: #0284c7;">${formatVND(order.final_amount)}</td>
            </tr>
          </table>
        </div>

        <!-- Thông tin giao hàng -->
        <h3 style="font-size: 15px; color: #0f172a; margin: 20px 0 8px; font-weight: 700;">Địa chỉ giao hàng:</h3>
        <div style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; padding: 14px; font-size: 13px; color: #334155; line-height: 1.5;">
          <strong>Người nhận:</strong> ${order.recipient_name}<br/>
          <strong>Số điện thoại:</strong> ${order.recipient_phone}<br/>
          <strong>Địa chỉ:</strong> ${order.shipping_address}<br/>
          ${order.order_notes ? `<strong>Ghi chú:</strong> <em>${order.order_notes}</em><br/>` : ''}
        </div>

        <!-- Lời kết -->
        <p style="font-size: 13px; color: #64748b; line-height: 1.6; margin-top: 24px;">
          Nếu có bất kỳ thắc mắc hoặc yêu cầu hỗ trợ nào về đơn hàng, Quý khách vui lòng liên hệ trực tiếp hotline: <strong style="color: #0284c7;">1900 6868</strong> hoặc phản hồi lại email này.
        </p>
      </div>

      <!-- Footer -->
      <div style="background-color: #0f172a; padding: 20px 24px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #1e293b;">
        <p style="margin: 0 0 6px 0; color: #f8fafc; font-weight: bold;">CÔNG TY TNHH TECHSHOP VIỆT NAM</p>
        <p style="margin: 0 0 4px 0;">Showroom: 123 Cầu Giấy, Hà Nội & 456 CMT8, Quận 10, TP.HCM</p>
        <p style="margin: 0; color: #64748b;">Email được gửi tự động từ hệ thống quản lý đơn hàng TechShop.</p>
      </div>
    </div>
  </body>
  </html>
  `;
}

/**
 * Gửi email xác nhận thanh toán thành công cho đơn hàng
 * @param {string} orderCode - Mã đơn hàng (ví dụ: ORD-1730000000000-1234)
 */
async function sendPaymentSuccessEmail(orderCode) {
  try {
    const cleanCode = String(orderCode || '').trim();
    if (!cleanCode) return { success: false, message: 'Mã đơn hàng không hợp lệ.' };

    // 1. Truy vấn đơn hàng cùng thông tin khách hàng
    const [orderRows] = await pool.query(
      `SELECT o.*, c.email AS customer_email, c.name AS customer_name
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       WHERE o.order_code = ? LIMIT 1`,
      [cleanCode]
    );

    if (!orderRows.length) {
      console.warn(`[EMAIL SERVICE] Không tìm thấy đơn hàng ${cleanCode} để gửi email.`);
      return { success: false, message: 'Không tìm thấy đơn hàng.' };
    }

    const order = orderRows[0];
    const targetEmail = String(order.recipient_email || order.customer_email || '').trim();

    if (!targetEmail || !targetEmail.includes('@')) {
      console.warn(`[EMAIL SERVICE] Đơn hàng ${cleanCode} không có địa chỉ email hợp lệ để gửi thông báo.`);
      return { success: false, message: 'Đơn hàng không có địa chỉ email nhận thông báo.' };
    }

    // 2. Truy vấn danh sách sản phẩm trong đơn hàng
    const [items] = await pool.query(
      `SELECT * FROM order_items WHERE order_id = ?`,
      [order.id]
    );

    const emailSubject = `[TechShop] Xác nhận thanh toán thành công đơn hàng #${order.order_code}`;
    const emailHtml = buildPaymentSuccessHtml({ order, items, targetEmail });

    // 3. Tiến hành gửi email
    const mailer = getTransporter();
    if (!mailer) {
      // Chế độ Simulator / Dev khi chưa cấu hình tài khoản SMTP
      console.log(`\n======================================================`);
      console.log(`📬 [EMAIL SERVICE - DEV SIMULATOR]`);
      console.log(`Gửi tới: ${targetEmail} (${order.recipient_name})`);
      console.log(`Tiêu đề: ${emailSubject}`);
      console.log(`Tổng thanh toán: ${formatVND(order.final_amount)}`);
      console.log(`Mã đơn: ${order.order_code}`);
      console.log(`Trạng thái: Đã tạo và mô phỏng gửi email thành công 100%!`);
      console.log(`(Để gửi email thật tới hộp thư, vui lòng cấu hình SMTP_USER và SMTP_PASS trong .env)`);
      console.log(`======================================================\n`);
      return { success: true, simulated: true, to: targetEmail };
    }

    const fromAddress = process.env.SMTP_FROM || `TechShop Vietnam <${process.env.SMTP_USER}>`;
    const mailOptions = {
      from: fromAddress,
      to: targetEmail,
      subject: emailSubject,
      html: emailHtml
    };

    const info = await mailer.sendMail(mailOptions);
    await pool.query(
      "UPDATE orders SET confirmation_email_sent = 1, email_sent_at = NOW() WHERE order_code = ?",
      [cleanCode]
    );
    console.log(`✅ [EMAIL SERVICE] Đã gửi email xác nhận thanh toán đơn #${cleanCode} tới ${targetEmail}. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId, to: targetEmail };
  } catch (error) {
    console.error(`❌ [EMAIL SERVICE] Lỗi khi gửi email xác nhận thanh toán đơn #${orderCode}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Gửi email xác nhận đặt hàng thành công (dành cho đơn COD)
 * @param {string} orderCode - Mã đơn hàng
 */
async function sendOrderConfirmationEmail(orderCode) {
  try {
    const cleanCode = String(orderCode || '').trim();
    if (!cleanCode) return { success: false, message: 'Mã đơn hàng không hợp lệ.' };

    const [orderRows] = await pool.query(
      `SELECT o.*, c.email AS customer_email, c.name AS customer_name
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       WHERE o.order_code = ? LIMIT 1`,
      [cleanCode]
    );

    if (!orderRows.length) return { success: false, message: 'Không tìm thấy đơn hàng.' };

    const order = orderRows[0];
    const targetEmail = String(order.recipient_email || order.customer_email || '').trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      return { success: false, message: 'Đơn hàng không có địa chỉ email nhận thông báo.' };
    }

    const [items] = await pool.query(
      `SELECT * FROM order_items WHERE order_id = ?`,
      [order.id]
    );

    const emailSubject = `[TechShop] Xác nhận đặt hàng thành công #${order.order_code}`;
    const emailHtml = buildPaymentSuccessHtml({ order, items, targetEmail });

    const mailer = getTransporter();
    if (!mailer) {
      console.log(`\n======================================================`);
      console.log(`📬 [EMAIL SERVICE - DEV SIMULATOR]`);
      console.log(`Gửi tới: ${targetEmail} (${order.recipient_name})`);
      console.log(`Tiêu đề: ${emailSubject}`);
      console.log(`Tổng thanh toán COD: ${formatVND(order.final_amount)}`);
      console.log(`Mã đơn: ${order.order_code}`);
      console.log(`Trạng thái: Đã tạo và mô phỏng gửi email đặt hàng COD thành công!`);
      console.log(`======================================================\n`);
      return { success: true, simulated: true, to: targetEmail };
    }

    const fromAddress = process.env.SMTP_FROM || `TechShop Vietnam <${process.env.SMTP_USER}>`;
    const mailOptions = {
      from: fromAddress,
      to: targetEmail,
      subject: emailSubject,
      html: emailHtml
    };

    const info = await mailer.sendMail(mailOptions);
    await pool.query(
      "UPDATE orders SET confirmation_email_sent = 1, email_sent_at = NOW() WHERE order_code = ?",
      [cleanCode]
    );
    console.log(`✅ [EMAIL SERVICE] Đã gửi email xác nhận đặt hàng COD đơn #${cleanCode} tới ${targetEmail}. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId, to: targetEmail };
  } catch (error) {
    console.error(`❌ [EMAIL SERVICE] Lỗi khi gửi email xác nhận đặt hàng đơn #${orderCode}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Cơ chế tự phục hồi (Self-Healing / Retry Worker)
 * Quét CSDL tìm các đơn hàng đã thanh toán (paid) hoặc COD nhưng chưa gửi được email
 * (do máy chủ sập đột ngột, restart hoặc mất mạng) để tự động gửi bù ngay lập tức.
 */
async function retryPendingConfirmationEmails() {
  try {
    const [pendingOrders] = await pool.query(
      `SELECT order_code, payment_method, payment_status
       FROM orders
       WHERE (confirmation_email_sent = 0 OR confirmation_email_sent IS NULL)
         AND (payment_status = 'paid' OR payment_method = 'cod')
         AND created_at >= NOW() - INTERVAL 7 DAY
       ORDER BY id ASC
       LIMIT 10`
    );

    if (!pendingOrders.length) return;

    console.log(`[EMAIL RECOVERY] Phát hiện ${pendingOrders.length} đơn hàng chưa nhận được email (do hệ thống sập/restart trước đó). Đang tiến hành gửi bù tự động...`);

    for (const ord of pendingOrders) {
      try {
        if (ord.payment_status === 'paid') {
          await sendPaymentSuccessEmail(ord.order_code);
        } else if (ord.payment_method === 'cod') {
          await sendOrderConfirmationEmail(ord.order_code);
        }
      } catch (err) {
        console.error(`[EMAIL RECOVERY] Lỗi khi gửi bù cho đơn ${ord.order_code}:`, err.message);
      }
    }
  } catch (error) {
    console.error('[EMAIL RECOVERY] Lỗi quét CSDL tìm đơn chưa gửi email:', error.message);
  }
}

module.exports = {
  sendPaymentSuccessEmail,
  sendOrderConfirmationEmail,
  retryPendingConfirmationEmails,
  buildPaymentSuccessHtml
};

