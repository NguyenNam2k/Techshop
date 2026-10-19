const ReportRepository = require('../../repositories/manager/reportRepository');

/**
 * Report Service
 * Coordinates aggregation and builds formatted report data
 */
class ReportService {
  /**
   * Get comprehensive monthly report for Manager
   */
  static async getMonthlyReport(year, month) {
    const currentYear = year ? parseInt(year, 10) : new Date().getFullYear();
    const currentMonth = month ? parseInt(month, 10) : (new Date().getMonth() + 1);

    const [summary, topProducts, dailyTrends, categorySales] = await Promise.all([
      ReportRepository.getMonthlySummary(currentYear, currentMonth),
      ReportRepository.getTopSellingProducts(currentYear, currentMonth, 6),
      ReportRepository.getDailyRevenueTrend(currentYear, currentMonth),
      ReportRepository.getCategorySales(currentYear, currentMonth)
    ]);

    // Calculate delivery completion rate
    const totalOrders = parseInt(summary.total_orders, 10) || 0;
    const deliveredOrders = parseInt(summary.delivered_orders, 10) || 0;
    const completionRate = totalOrders > 0 
      ? Math.round((deliveredOrders / totalOrders) * 100) 
      : 100;

    return {
      period: {
        year: currentYear,
        month: currentMonth,
        formatted: `Tháng ${currentMonth}/${currentYear}`
      },
      summary: {
        ...summary,
        completion_rate: completionRate
      },
      topProducts,
      dailyTrends,
      categorySales
    };
  }
}

module.exports = ReportService;
