import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  RefreshCw,
  Download,
  Loader2,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Truck,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { showToast } from '../components/Toast';

export default function ReportsView() {
  const [month, setMonth] = useState(10);
  const [year, setYear] = useState(2026);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/monthly?month=${month}&year=${year}`);
      const data = await res.json();
      if (data.success) {
        setReport(data.data);
      }
    } catch (err) {
      showToast('Không thể tải dữ liệu báo cáo kinh doanh', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [month, year]);

  const handleExportCsv = () => {
    window.open(`/api/reports/monthly/export?month=${month}&year=${year}`, '_blank');
    showToast('Đang tải file CSV báo cáo...', 'info');
  };

  const summary = report?.summary || {};
  const topProducts = report?.topProducts || [];

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-emerald-400" />
            <span>Báo Cáo Hoạt Động & Doanh Thu Kinh Doanh</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Tổng hợp kết quả tài chính, số lượng đơn hàng và top thiết bị bán chạy nhất
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 text-xs transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Báo Cáo (CSV)</span>
          </button>
        </div>
      </div>

      {/* Period Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-900/60 rounded-2xl border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Chọn kỳ thống kê:</span>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-emerald-400 cursor-pointer"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
              <option key={m} value={m}>
                Tháng {m}
              </option>
            ))}
          </select>

          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-emerald-400 cursor-pointer"
          >
            <option value="2025">Năm 2025</option>
            <option value="2026">Năm 2026</option>
            <option value="2027">Năm 2027</option>
          </select>

          <button
            type="button"
            onClick={fetchReport}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
            title="Làm mới"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="text-[11px] font-mono px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          Kỳ báo cáo: Tháng {month}/{year}
        </div>
      </div>

      {/* Report Content */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
          <span className="text-sm">Đang tính toán số liệu tài chính...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary 4-grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card rounded-2xl p-5 border border-slate-800 relative overflow-hidden">
              <p className="text-slate-400 font-medium text-xs">Tổng Doanh Thu</p>
              <h4 className="text-2xl font-bold font-mono text-emerald-400 mt-2">
                {Number(summary.total_revenue || 0).toLocaleString('vi-VN')} ₫
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <span>Doanh thu theo đơn thực tế</span>
              </p>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-transparent"></div>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-slate-800 relative overflow-hidden">
              <p className="text-slate-400 font-medium text-xs">Tổng Số Đơn Hàng</p>
              <h4 className="text-2xl font-bold font-mono text-white mt-2">
                {summary.total_orders || 0} <span className="text-sm font-normal text-slate-400">đơn</span>
              </h4>
              <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                <span>Tỷ lệ hoàn thành: {summary.completion_rate ?? 100}%</span>
              </p>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-transparent"></div>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-slate-800 relative overflow-hidden">
              <p className="text-slate-400 font-medium text-xs">Giá Trị Đơn Trung Bình (AOV)</p>
              <h4 className="text-2xl font-bold font-mono text-cyan-400 mt-2">
                {Number(Math.round(summary.avg_order_value || 0)).toLocaleString('vi-VN')} ₫
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <span>Average Order Value</span>
              </p>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-transparent"></div>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-slate-800 relative overflow-hidden">
              <p className="text-slate-400 font-medium text-xs">Đơn Giao Thành Công</p>
              <h4 className="text-2xl font-bold font-mono text-violet-400 mt-2">
                {summary.delivered_orders || 0} / {summary.total_orders || 0}
              </h4>
              <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                <span>Hủy: {summary.cancelled_orders || 0} đơn</span>
              </p>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-rose-500 to-transparent"></div>
            </div>
          </div>

          {/* Top Products Table */}
          <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden space-y-4 p-5">
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Top Thiết Bị Công Nghệ Bán Chạy Nhất Kỳ {month}/{year}</span>
            </h3>

            <div className="overflow-x-auto rounded-xl border border-slate-800/80">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Thứ hạng</th>
                    <th className="py-3 px-4">Thiết Bị Công Nghệ</th>
                    <th className="py-3 px-4">Mã SKU</th>
                    <th className="py-3 px-4 text-center">Số Lượng Bán</th>
                    <th className="py-3 px-4 text-right">Tổng Doanh Thu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                  {topProducts.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-400">
                        Chưa ghi nhận dữ liệu bán hàng cho kỳ này.
                      </td>
                    </tr>
                  ) : (
                    topProducts.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-cyan-400">#{idx + 1}</td>
                        <td className="py-3 px-4 font-semibold text-slate-200">{p.product_name}</td>
                        <td className="py-3 px-4 font-mono text-slate-400">{p.sku}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-white">
                          {p.total_sold}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-400">
                          {Number(p.total_revenue || 0).toLocaleString('vi-VN')} ₫
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
