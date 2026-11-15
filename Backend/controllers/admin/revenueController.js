const adminRevenueService = require('../../services/admin/revenueService');

/**
 * Controller Báo cáo Doanh thu cho Admin
 */
const adminRevenueController = {
  /**
   * GET /api/admin/revenue/overview
   * Lấy dữ liệu phân tích doanh thu
   */
  getRevenueOverview: async (req, res) => {
    try {
      const { period, startDate, endDate, month, year } = req.query;

      const data = await adminRevenueService.getRevenueOverview({
        period,
        startDate,
        endDate,
        month,
        year
      });

      return res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      console.error('[AdminRevenueController.getRevenueOverview Error]:', error);
      return res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Lỗi khi lấy dữ liệu doanh thu!',
        error: error.message
      });
    }
  },

  /**
   * GET /api/admin/revenue/export
   * Xuất file CSV báo cáo doanh thu
   */
  exportRevenueReport: async (req, res) => {
    try {
      const { period, startDate, endDate, month, year } = req.query;

      const data = await adminRevenueService.getRevenueOverview({
        period,
        startDate,
        endDate,
        month,
        year
      });

      // Tạo nội dung CSV
      let csv = '\uFEFF'; // BOM cho Excel đọc UTF-8 tiếng Việt
      csv += 'BÁO CÁO DOANH THU TECHSHOP\r\n';
      csv += `Thời gian: ${data.period.label}\r\n`;
      csv += `Ngày xuất báo cáo: ${new Date().toLocaleString('vi-VN')}\r\n\r\n`;

      csv += '1. TỔNG QUAN CHỈ SỐ KINH DOANH\r\n';
      csv += `Tổng doanh thu thực tế (Đã thu):,${data.kpi.totalRevenue} VND\r\n`;
      csv += `Doanh thu chờ thu:,${data.kpi.pendingRevenue} VND\r\n`;
      csv += `Tổng số đơn hàng:,${data.kpi.totalOrders}\r\n`;
      csv += `Số đơn đã thanh toán:,${data.kpi.paidOrders}\r\n`;
      csv += `Số đơn giao thành công:,${data.kpi.deliveredOrders}\r\n`;
      csv += `Giá trị đơn hàng trung bình (AOV):,${data.kpi.avgOrderValue} VND\r\n`;
      csv += `Tỷ lệ hoàn thành đơn:,${data.kpi.completionRate}%\r\n\r\n`;

      csv += '2. CHI TIẾT DOANH THU THEO MỐC THỜI GIAN\r\n';
      csv += 'Thời gian,Số đơn hàng,Số đơn đã thanh toán,Doanh thu (VND)\r\n';
      data.timeline.forEach((row) => {
        csv += `"${row.label}",${row.ordersCount},${row.paidOrders},${row.revenue}\r\n`;
      });
      csv += '\r\n';

      csv += '3. TOP SẢN PHẨM BÁN CHẠY NHẤT\r\n';
      csv += 'Tên sản phẩm,Mã SKU,Số lượng bán,Doanh thu (VND)\r\n';
      data.topProducts.forEach((p) => {
        csv += `"${p.productName.replace(/"/g, '""')}","${p.sku}",${p.totalSold},${p.totalRevenue}\r\n`;
      });
      csv += '\r\n';

      csv += '4. DOANH THU THEO DANH MỤC\r\n';
      csv += 'Danh mục,Số món bán,Doanh thu (VND),Tỷ lệ đóng góp\r\n';
      data.categoryBreakdown.forEach((c) => {
        csv += `"${c.categoryName}",${c.itemsSold},${c.revenue},${c.percentage}%\r\n`;
      });

      const filename = `Techshop_DoanhThu_${period || 'overview'}_${Date.now()}.csv`;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).send(csv);
    } catch (error) {
      console.error('[AdminRevenueController.exportRevenueReport Error]:', error);
      return res.status(500).json({
        success: false,
        message: 'Không thể xuất file báo cáo doanh thu!'
      });
    }
  }
};

module.exports = adminRevenueController;
