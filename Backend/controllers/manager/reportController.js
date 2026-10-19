const ReportService = require('../../services/manager/reportService');

/**
 * Report Controller
 * Handles monthly and business report requests for Manager
 */
class ReportController {
  /**
   * GET /api/reports/monthly - Lấy dữ liệu báo cáo thống kê tháng
   */
  static async getMonthlyReport(req, res, next) {
    try {
      const year = req.query.year || new Date().getFullYear();
      const month = req.query.month || (new Date().getMonth() + 1);

      const reportData = await ReportService.getMonthlyReport(year, month);
      return res.status(200).json({
        success: true,
        data: reportData
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/reports/monthly/export - Xuất file dữ liệu báo cáo (CSV)
   */
  static async exportMonthlyReport(req, res, next) {
    try {
      const year = req.query.year || new Date().getFullYear();
      const month = req.query.month || (new Date().getMonth() + 1);

      const reportData = await ReportService.getMonthlyReport(year, month);
      
      // Build CSV content
      let csv = `\uFEFFBÁO CÁO KINH DOANH THÁNG ${month}/${year} - TECHSHOP\n\n`;
      csv += `TỔNG QUAN\n`;
      csv += `Tổng doanh thu,${reportData.summary.total_revenue} VNĐ\n`;
      csv += `Tổng đơn hàng,${reportData.summary.total_orders}\n`;
      csv += `Giá trị đơn trung bình (AOV),${Math.round(reportData.summary.avg_order_value)} VNĐ\n`;
      csv += `Đơn hoàn thành,${reportData.summary.delivered_orders}\n`;
      csv += `Đơn đang giao,${reportData.summary.shipping_orders}\n`;
      csv += `Đơn đã hủy,${reportData.summary.cancelled_orders}\n`;
      csv += `Tỷ lệ hoàn thành,${reportData.summary.completion_rate}%\n\n`;

      csv += `TOP SẢN PHẨM BÁN CHẠY\n`;
      csv += `Tên thiết bị,Mã SKU,Số lượng bán,Doanh thu (VNĐ)\n`;
      reportData.topProducts.forEach(p => {
        csv += `"${p.product_name}","${p.sku}",${p.total_sold},${p.total_revenue}\n`;
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="TechShop_Report_${year}_${month}.csv"`);
      return res.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ReportController;
