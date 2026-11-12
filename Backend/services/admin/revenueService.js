const { pool } = require('../../config/database');

/**
 * Service phân tích & báo cáo doanh thu bán hàng cho Admin
 */
const adminRevenueService = {
  /**
   * Lấy báo cáo tổng hợp doanh thu theo thời gian, sản phẩm, danh mục, phương thức thanh toán
   */
  getRevenueOverview: async ({
    period = '30days',
    startDate = '',
    endDate = '',
    month = null,
    year = null
  } = {}) => {
    const whereConditions = [];
    const queryParams = [];
    let periodLabel = '';
    let isYearlyGrouping = false;

    const now = new Date();
    const currentYear = year ? parseInt(year, 10) : now.getFullYear();
    const currentMonth = month ? parseInt(month, 10) : (now.getMonth() + 1);

    switch (period) {
      case 'today':
        whereConditions.push('o.created_at >= CURDATE() AND o.created_at < CURDATE() + INTERVAL 1 DAY');
        periodLabel = 'Hôm nay';
        break;

      case '7days':
        whereConditions.push('o.created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)');
        periodLabel = '7 ngày qua';
        break;

      case '30days':
        whereConditions.push('o.created_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)');
        periodLabel = '30 ngày qua';
        break;

      case 'month':
        whereConditions.push('YEAR(o.created_at) = ? AND MONTH(o.created_at) = ?');
        queryParams.push(currentYear, currentMonth);
        periodLabel = `Tháng ${currentMonth}/${currentYear}`;
        break;

      case 'year':
        whereConditions.push('YEAR(o.created_at) = ?');
        queryParams.push(currentYear);
        periodLabel = `Năm ${currentYear}`;
        isYearlyGrouping = true;
        break;

      case 'custom':
        if (startDate) {
          whereConditions.push('o.created_at >= ?');
          queryParams.push(`${startDate} 00:00:00`);
        }
        if (endDate) {
          whereConditions.push('o.created_at <= ?');
          queryParams.push(`${endDate} 23:59:59`);
        }
        periodLabel = startDate && endDate ? `${startDate} đến ${endDate}` : 'Tùy chỉnh';
        break;

      case 'all':
      default:
        periodLabel = 'Toàn bộ thời gian';
        isYearlyGrouping = true;
        break;
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // 1. Thống kê chỉ số KPI tổng hợp
    const kpiSql = `
      SELECT 
        COUNT(*) AS total_orders,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' AND shipping_status != 'cancelled' THEN final_amount ELSE 0 END), 0) AS total_revenue,
        COALESCE(SUM(CASE WHEN payment_status = 'unpaid' AND shipping_status != 'cancelled' THEN final_amount ELSE 0 END), 0) AS pending_revenue,
        COALESCE(SUM(CASE WHEN shipping_status != 'cancelled' THEN final_amount ELSE 0 END), 0) AS gross_order_amount,
        COALESCE(AVG(CASE WHEN payment_status = 'paid' AND shipping_status != 'cancelled' THEN final_amount ELSE NULL END), 0) AS avg_order_value,
        SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) AS paid_orders,
        SUM(CASE WHEN shipping_status = 'delivered' THEN 1 ELSE 0 END) AS delivered_orders,
        SUM(CASE WHEN shipping_status = 'shipping' THEN 1 ELSE 0 END) AS shipping_orders,
        SUM(CASE WHEN shipping_status = 'processing' THEN 1 ELSE 0 END) AS processing_orders,
        SUM(CASE WHEN shipping_status = 'pending' THEN 1 ELSE 0 END) AS pending_orders,
        SUM(CASE WHEN shipping_status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_orders
      FROM orders o
      ${whereClause}
    `;

    const [[kpi]] = await pool.query(kpiSql, queryParams);

    const totalOrdersCount = parseInt(kpi.total_orders, 10) || 0;
    const deliveredCount = parseInt(kpi.delivered_orders, 10) || 0;
    const completionRate = totalOrdersCount > 0
      ? Math.round((deliveredCount / totalOrdersCount) * 100)
      : 0;

    // 2. Xu hướng doanh thu theo thời gian (Timeline)
    let timelineSql = '';
    if (isYearlyGrouping) {
      timelineSql = `
        SELECT 
          DATE_FORMAT(o.created_at, '%Y-%m') AS date,
          DATE_FORMAT(o.created_at, 'T%m/%Y') AS label,
          COUNT(*) AS orders_count,
          SUM(CASE WHEN o.payment_status = 'paid' THEN 1 ELSE 0 END) AS paid_orders,
          COALESCE(SUM(CASE WHEN o.payment_status = 'paid' AND o.shipping_status != 'cancelled' THEN o.final_amount ELSE 0 END), 0) AS revenue
        FROM orders o
        ${whereClause}
        GROUP BY DATE_FORMAT(o.created_at, '%Y-%m'), DATE_FORMAT(o.created_at, 'T%m/%Y')
        ORDER BY date ASC
      `;
    } else {
      timelineSql = `
        SELECT 
          DATE_FORMAT(o.created_at, '%Y-%m-%d') AS date,
          DATE_FORMAT(o.created_at, '%d/%m') AS label,
          COUNT(*) AS orders_count,
          SUM(CASE WHEN o.payment_status = 'paid' THEN 1 ELSE 0 END) AS paid_orders,
          COALESCE(SUM(CASE WHEN o.payment_status = 'paid' AND o.shipping_status != 'cancelled' THEN o.final_amount ELSE 0 END), 0) AS revenue
        FROM orders o
        ${whereClause}
        GROUP BY DATE_FORMAT(o.created_at, '%Y-%m-%d'), DATE_FORMAT(o.created_at, '%d/%m')
        ORDER BY date ASC
      `;
    }

    const [timelineRows] = await pool.query(timelineSql, queryParams);

    // 3. Phân bổ doanh thu theo phương thức thanh toán
    const paymentSql = `
      SELECT 
        o.payment_method,
        COUNT(*) AS orders_count,
        SUM(CASE WHEN o.payment_status = 'paid' THEN 1 ELSE 0 END) AS paid_count,
        COALESCE(SUM(CASE WHEN o.payment_status = 'paid' AND o.shipping_status != 'cancelled' THEN o.final_amount ELSE 0 END), 0) AS paid_revenue,
        COALESCE(SUM(CASE WHEN o.shipping_status != 'cancelled' THEN o.final_amount ELSE 0 END), 0) AS total_revenue
      FROM orders o
      ${whereClause}
      GROUP BY o.payment_method
    `;
    const [paymentRows] = await pool.query(paymentSql, queryParams);

    const totalRev = Number(kpi.total_revenue) || 1; // tránh chia cho 0
    const paymentBreakdown = paymentRows.map(row => {
      const isVietQr = row.payment_method === 'vietqr_banking';
      const paidRev = Number(row.paid_revenue);
      return {
        method: row.payment_method,
        label: isVietQr ? 'VietQR Banking' : 'Thanh toán COD',
        ordersCount: Number(row.orders_count),
        paidCount: Number(row.paid_count),
        revenue: paidRev,
        totalRevenue: Number(row.total_revenue),
        percentage: totalRev > 0 ? Math.round((paidRev / totalRev) * 100) : 0
      };
    });

    // 4. Phân bổ theo trạng thái vận chuyển
    const statusLabels = {
      pending: 'Chờ xác nhận',
      processing: 'Đang chuẩn bị hàng',
      shipping: 'Đang giao hàng',
      delivered: 'Giao thành công',
      cancelled: 'Đã hủy đơn'
    };
    const shippingBreakdown = [
      { status: 'delivered', label: statusLabels.delivered, count: Number(kpi.delivered_orders) },
      { status: 'shipping', label: statusLabels.shipping, count: Number(kpi.shipping_orders) },
      { status: 'processing', label: statusLabels.processing, count: Number(kpi.processing_orders) },
      { status: 'pending', label: statusLabels.pending, count: Number(kpi.pending_orders) },
      { status: 'cancelled', label: statusLabels.cancelled, count: Number(kpi.cancelled_orders) }
    ];

    // 5. Top sản phẩm đem lại doanh thu cao nhất
    const topProductsSql = `
      SELECT 
        oi.product_name,
        oi.sku,
        SUM(oi.quantity) AS total_sold,
        SUM(oi.subtotal) AS total_revenue,
        COALESCE(MAX(pv.image_url), MAX(p.thumbnail_url), '') AS image_url
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      LEFT JOIN product_variants pv ON oi.variant_id = pv.id
      LEFT JOIN products p ON pv.product_id = p.id
      ${whereClause ? whereClause + ' AND' : 'WHERE'} o.shipping_status != 'cancelled'
      GROUP BY oi.product_name, oi.sku
      ORDER BY total_revenue DESC
      LIMIT 8
    `;
    const [topProducts] = await pool.query(topProductsSql, queryParams);

    // 6. Doanh thu theo danh mục sản phẩm
    const categorySql = `
      SELECT 
        COALESCE(c.name, 'Linh kiện & Khác') AS category_name,
        COUNT(oi.id) AS items_sold,
        COALESCE(SUM(oi.subtotal), 0) AS category_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      LEFT JOIN product_variants pv ON oi.variant_id = pv.id
      LEFT JOIN products p ON pv.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause ? whereClause + ' AND' : 'WHERE'} o.shipping_status != 'cancelled'
      GROUP BY COALESCE(c.name, 'Linh kiện & Khác')
      ORDER BY category_revenue DESC
    `;
    const [categoryRows] = await pool.query(categorySql, queryParams);

    const totalCategoryRev = categoryRows.reduce((sum, r) => sum + Number(r.category_revenue), 0) || 1;
    const categoryBreakdown = categoryRows.map(r => ({
      categoryName: r.category_name,
      itemsSold: Number(r.items_sold),
      revenue: Number(r.category_revenue),
      percentage: Math.round((Number(r.category_revenue) / totalCategoryRev) * 100)
    }));

    return {
      period: {
        type: period,
        label: periodLabel,
        startDate: startDate || null,
        endDate: endDate || null
      },
      kpi: {
        totalRevenue: Number(kpi.total_revenue),
        pendingRevenue: Number(kpi.pending_revenue),
        grossOrderAmount: Number(kpi.gross_order_amount),
        avgOrderValue: Math.round(Number(kpi.avg_order_value)),
        totalOrders: totalOrdersCount,
        paidOrders: Number(kpi.paid_orders),
        deliveredOrders: deliveredCount,
        cancelledOrders: Number(kpi.cancelled_orders),
        completionRate
      },
      timeline: timelineRows.map(row => ({
        date: row.date,
        label: row.label,
        revenue: Number(row.revenue),
        ordersCount: Number(row.orders_count),
        paidOrders: Number(row.paid_orders)
      })),
      paymentBreakdown,
      shippingBreakdown,
      topProducts: topProducts.map(p => ({
        productName: p.product_name,
        sku: p.sku,
        totalSold: Number(p.total_sold),
        totalRevenue: Number(p.total_revenue),
        imageUrl: p.image_url
      })),
      categoryBreakdown
    };
  }
};

module.exports = adminRevenueService;
