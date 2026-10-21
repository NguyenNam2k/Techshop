const express = require('express');
const router = express.Router();
const ReportController = require('../../controllers/manager/reportController');

/**
 * Report API Routes
 * Base path: /api/reports
 */

// GET /api/reports/monthly - Thống kê báo cáo tháng
router.get('/monthly', ReportController.getMonthlyReport);

// GET /api/reports/monthly/export - Xuất file CSV báo cáo tháng
router.get('/monthly/export', ReportController.exportMonthlyReport);

module.exports = router;
