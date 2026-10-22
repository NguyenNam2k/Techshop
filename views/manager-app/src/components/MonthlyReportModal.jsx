import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  X,
  RefreshCw,
  Download,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  CheckCircle,
  Truck,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { showToast } from './Toast';

export default function MonthlyReportModal({ isOpen, onClose }) {
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
    if (isOpen) {
      fetchReport();
    }
  }, [isOpen, month, year]);

  if (!isOpen) return null;

  const handleExportCsv = () => {
    window.open(`/api/reports/monthly/export?month=${month}&year=${year}`, '_blank');
    showToast('Đang tải file CSV báo cáo...', 'info');
  };

  const summary = report?.summary || {};
  const topProducts = report?.topProducts || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-card rounded-2xl w-full max-w-4xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-scale-in">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Báo Cáo Hoạt Động & Doanh Thu Tháng</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Tháng {month}/{year}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Tổng hợp kết quả kinh doanh, số lượng đơn hàng và top thiết bị bán chạy cho Manager
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action & Period Selector */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/40 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Kỳ báo cáo:</span>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-emerald-400 cursor-pointer"
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
              className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-emerald-400 cursor-pointer"
            >
              <option value="2025">Năm 2025</option>
              <option value="2026">Năm 2026</option>
              <option value="2027">Năm 2027</option>
            </select>

            <button
              type="button"
              onClick={fetchReport}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
              title="Làm mới"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất Báo Cáo (CSV)</span>
          </button>
        </div>

        {/* Report Content Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5 text-xs">
          {loading ? (
            <div className="text-center py-16 text-slate-400 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              <span>Đang tính toán số liệu kinh doanh...</span>
            </div>
          ) : (
            <>
              {/* Summary 4-grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800">
                  <p className="text-slate-400 font-medium">Tổng Doanh Thu</p>
                  <h4 className="text-xl font-bold font-mono text-emerald-400 mt-1">
                    {Number(summary.total_revenue || 0).toLocaleString('vi-VN')} ₫
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Doanh thu thực tế theo hóa đơn
                  </p>
                </div>

                <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800">
                  <p className="text-slate-400 font-medium">Tổng Số Đơn Hàng</p>
                  <h4 className="text-xl font-bold font-mono text-white mt-1">
                    {summary.total_orders || 0} đơn
                  </h4>
                  <p className="text-[10px] text-emerald-400 mt-1">
                    Tỷ lệ hoàn thành: {summary.completion_rate ?? 100}%
                  </p>
                </div>

                <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800">
                  <p className="text-slate-400 font-medium">Giá Trị Đơn Trung Bình (AOV)</p>
                  <h4 className="text-xl font-bold font-mono text-cyan-400 mt-1">
                    {Number(Math.round(summary.avg_order_value || 0)).toLocaleString('vi-VN')} ₫
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1">Average Order Value</p>
                </div>

                <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800">
                  <p className="text-slate-400 font-medium">Đơn Hoàn Thành / Đã Giao</p>
                  <h4 className="text-xl font-bold font-mono text-violet-400 mt-1">
                    {summary.delivered_orders || 0} / {summary.total_orders || 0}
                  </h4>
                  <p className="text-[10px] text-rose-400 mt-1">
                    Hủy: {summary.cancelled_orders || 0} đơn
                  </p>
                </div>
              </div>

              {/* Top selling products table */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-slate-200 text-sm">Top Thiết Bị Bán Chạy Trong Tháng</h4>
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Top</th>
                        <th className="py-2.5 px-3">Thiết Bị</th>
                        <th className="py-2.5 px-3">SKU</th>
                        <th className="py-2.5 px-3 text-center">Số Lượng Bán</th>
                        <th className="py-2.5 px-3 text-right">Tổng Doanh Thu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                      {topProducts.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-6 text-center text-slate-400">
                            Chưa có dữ liệu bán hàng trong kỳ này.
                          </td>
                        </tr>
                      ) : (
                        topProducts.map((p, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/30">
                            <td className="py-2 px-3 font-mono font-bold text-cyan-400">#{idx + 1}</td>
                            <td className="py-2 px-3 font-semibold text-slate-200">{p.product_name}</td>
                            <td className="py-2 px-3 font-mono text-slate-400">{p.sku}</td>
                            <td className="py-2 px-3 text-center font-mono text-slate-200">{p.total_sold}</td>
                            <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-400">
                              {Number(p.total_revenue || 0).toLocaleString('vi-VN')} ₫
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
