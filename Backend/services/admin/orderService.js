const { pool } = require('../../config/database');

/**
 * Service quản lý đơn hàng cho Admin
 */
const adminOrderService = {
  /**
   * Lấy danh sách đơn hàng có phân trang, tìm kiếm và lọc đa điều kiện
   */
  getOrders: async ({
    search = '',
    paymentMethod = 'all',
    paymentStatus = 'all',
    shippingStatus = 'all',
    startDate = '',
    endDate = '',
    page = 1,
    limit = 10,
    sortBy = 'created_at',
    sortOrder = 'DESC'
  } = {}) => {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const whereConditions = [];
    const queryParams = [];

    // 1. Tìm kiếm theo mã đơn, người nhận, sđt, email
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      whereConditions.push(
        '(o.order_code LIKE ? OR o.recipient_name LIKE ? OR o.recipient_phone LIKE ? OR o.recipient_email LIKE ?)'
      );
      queryParams.push(term, term, term, term);
    }

    // 2. Lọc theo phương thức thanh toán
    if (paymentMethod && paymentMethod !== 'all') {
      whereConditions.push('o.payment_method = ?');
      queryParams.push(paymentMethod);
    }

    // 3. Lọc theo trạng thái thanh toán
    if (paymentStatus && paymentStatus !== 'all') {
      whereConditions.push('o.payment_status = ?');
      queryParams.push(paymentStatus);
    }

    // 4. Lọc theo trạng thái vận chuyển
    if (shippingStatus && shippingStatus !== 'all') {
      whereConditions.push('o.shipping_status = ?');
      queryParams.push(shippingStatus);
    }

    // 5. Lọc theo ngày đặt hàng
    if (startDate) {
      whereConditions.push('o.created_at >= ?');
      queryParams.push(`${startDate} 00:00:00`);
    }
    if (endDate) {
      whereConditions.push('o.created_at <= ?');
      queryParams.push(`${endDate} 23:59:59`);
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Sắp xếp
    const validSortCols = {
      created_at: 'o.created_at',
      final_amount: 'o.final_amount',
      order_code: 'o.order_code',
      id: 'o.id'
    };
    const sortCol = validSortCols[sortBy] || 'o.created_at';
    const sortDir = String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Đếm tổng số bản ghi
    const countSql = `SELECT COUNT(*) AS total FROM orders o ${whereClause}`;
    const [[{ total }]] = await pool.query(countSql, queryParams);

    // Lấy danh sách đơn hàng
    const ordersSql = `
      SELECT 
        o.id,
        o.order_code,
        o.customer_id,
        o.recipient_name,
        o.recipient_phone,
        o.recipient_email,
        o.shipping_address,
        o.payment_method,
        o.payment_status,
        o.shipping_status,
        o.total_amount,
        o.shipping_fee,
        o.final_amount,
        o.order_notes,
        o.confirmation_email_sent,
        o.email_sent_at,
        o.created_at,
        o.updated_at,
        c.email AS customer_account_email,
        c.name AS customer_account_name,
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS total_items,
        (SELECT oi.product_name FROM order_items oi WHERE oi.order_id = o.id ORDER BY oi.id ASC LIMIT 1) AS first_item_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      ${whereClause}
      ORDER BY ${sortCol} ${sortDir}, o.id DESC
      LIMIT ? OFFSET ?
    `;

    const [orders] = await pool.query(ordersSql, [...queryParams, limitNum, offset]);

    // Thống kê tổng quan nhanh (summary counters)
    const [summaryRows] = await pool.query(`
      SELECT 
        COUNT(*) AS total_orders,
        COALESCE(SUM(final_amount), 0) AS total_amount,
        SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) AS paid_count,
        SUM(CASE WHEN payment_status = 'unpaid' THEN 1 ELSE 0 END) AS unpaid_count,
        SUM(CASE WHEN shipping_status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
        SUM(CASE WHEN shipping_status = 'processing' THEN 1 ELSE 0 END) AS processing_count,
        SUM(CASE WHEN shipping_status = 'shipping' THEN 1 ELSE 0 END) AS shipping_count,
        SUM(CASE WHEN shipping_status = 'delivered' THEN 1 ELSE 0 END) AS delivered_count,
        SUM(CASE WHEN shipping_status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_count
      FROM orders
    `);

    return {
      orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: Number(total),
        totalPages: Math.ceil(total / limitNum) || 1
      },
      summary: summaryRows[0] || {}
    };
  },

  /**
   * Lấy chi tiết toàn bộ một đơn hàng kèm danh sách sản phẩm
   */
  getOrderDetail: async (orderCode) => {
    const cleanCode = String(orderCode || '').trim();
    if (!cleanCode) {
      throw { status: 400, message: 'Mã đơn hàng không hợp lệ!' };
    }

    const [orderRows] = await pool.query(
      `SELECT 
        o.*,
        c.name AS customer_name,
        c.email AS customer_email,
        c.phone AS customer_phone
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       WHERE o.order_code = ? LIMIT 1`,
      [cleanCode]
    );

    if (!orderRows.length) {
      throw { status: 404, message: `Không tìm thấy đơn hàng #${cleanCode}!` };
    }

    const order = orderRows[0];

    // Lấy danh sách sản phẩm trong đơn hàng kèm hình ảnh và thông tin chi tiết
    const [items] = await pool.query(
      `SELECT 
        oi.id,
        oi.order_id,
        oi.variant_id,
        oi.product_name,
        oi.variant_name,
        oi.sku,
        oi.unit_price,
        oi.quantity,
        oi.subtotal,
        oi.created_at,
        pv.product_id,
        pv.color,
        pv.spec_version,
        pv.stock AS current_stock,
        COALESCE(pv.image_url, p.thumbnail_url, '') AS image_url,
        COALESCE(p.brand, 'Techshop') AS brand,
        p.slug AS product_slug
       FROM order_items oi
       LEFT JOIN product_variants pv ON oi.variant_id = pv.id
       LEFT JOIN products p ON pv.product_id = p.id
       WHERE oi.order_id = ?
       ORDER BY oi.id ASC`,
      [order.id]
    );

    return {
      ...order,
      items
    };
  },

  /**
   * Cập nhật trạng thái giao hàng / trạng thái thanh toán của đơn hàng
   */
  updateOrderStatus: async (orderCode, { shippingStatus, paymentStatus }) => {
    const cleanCode = String(orderCode || '').trim();
    if (!cleanCode) {
      throw { status: 400, message: 'Mã đơn hàng không hợp lệ!' };
    }

    const [existingRows] = await pool.query(
      'SELECT id, order_code, payment_method, payment_status, shipping_status FROM orders WHERE order_code = ? LIMIT 1',
      [cleanCode]
    );

    if (!existingRows.length) {
      throw { status: 404, message: `Không tìm thấy đơn hàng #${cleanCode}!` };
    }

    const currentOrder = existingRows[0];
    const updateFields = [];
    const updateParams = [];

    const validShippingStatuses = ['pending', 'processing', 'shipping', 'delivered', 'cancelled'];
    const validPaymentStatuses = ['unpaid', 'paid', 'refunded'];

    if (shippingStatus) {
      if (!validShippingStatuses.includes(shippingStatus)) {
        throw { status: 400, message: `Trạng thái giao hàng không hợp lệ: ${shippingStatus}` };
      }
      updateFields.push('shipping_status = ?');
      updateParams.push(shippingStatus);

      // Nếu đơn COD được cập nhật thành đã giao hàng thành công (delivered), tự động chuyển payment_status thành paid nếu chưa paid
      if (shippingStatus === 'delivered' && currentOrder.payment_method === 'cod' && !paymentStatus) {
        updateFields.push('payment_status = ?');
        updateParams.push('paid');
      }
    }

    if (paymentStatus) {
      if (!validPaymentStatuses.includes(paymentStatus)) {
        throw { status: 400, message: `Trạng thái thanh toán không hợp lệ: ${paymentStatus}` };
      }
      updateFields.push('payment_status = ?');
      updateParams.push(paymentStatus);
    }

    if (updateFields.length === 0) {
      throw { status: 400, message: 'Không có thông tin trạng thái nào cần cập nhật!' };
    }

    updateFields.push('updated_at = NOW()');
    updateParams.push(currentOrder.id);

    await pool.query(
      `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`,
      updateParams
    );

    // Lấy lại đơn sau khi cập nhật
    const updated = await adminOrderService.getOrderDetail(cleanCode);
    return updated;
  }
};

module.exports = adminOrderService;
