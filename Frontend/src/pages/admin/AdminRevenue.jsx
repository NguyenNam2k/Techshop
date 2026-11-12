import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axiosInstance from '../../api/axiosInstance';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  CreditCard,
  QrCode,
  RotateCcw,
  Download,
  Calendar,
  Package,
  Layers,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const formatVND = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(n) || 0);

const formatShortVND = (n) => {
  const num = Number(n) || 0;
  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(1)} tỷ`;
  }
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)} tr`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(0)} k`;
  }
  return num.toString();
};

export default function AdminRevenue() {
  const [period, setPeriod] = useState('30days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState(null);
  const [hoveredBar, setHoveredBar] = useState(null);

  const fetchRevenue = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        period,
        startDate: period === 'custom' ? startDate : undefined,
        endDate: period === 'custom' ? endDate : undefined
      };
      const res = await axiosInstance.get('/admin/revenue/overview', { params });
      if (res.data.success) {
        setRevenueData(res.data.data);
      }
    } catch (err) {
      console.error('Lỗi tải dữ liệu doanh thu:', err);
    } finally {
      setLoading(false);
    }
  }, [period, startDate, endDate]);

  useEffect(() => {
    if (period !== 'custom' || (startDate && endDate)) {
      fetchRevenue();
    }
  }, [fetchRevenue, period, startDate, endDate]);

  // Xuất file CSV
  const handleExportCSV = () => {
    const query = new URLSearchParams({
      period,
      startDate: period === 'custom' ? startDate : '',
      endDate: period === 'custom' ? endDate : ''
    }).toString();
    window.open(`/api/admin/revenue/export?${query}`, '_blank');
  };

  const periodOptions = [
    { id: 'today', label: 'Hôm nay' },
    { id: '7days', label: '7 ngày qua' },
    { id: '30days', label: '30 ngày qua' },
    { id: 'month', label: 'Tháng này' },
    { id: 'year', label: 'Năm nay' },
    { id: 'all', label: 'Toàn thời gian' },
    { id: 'custom', label: 'Tùy chỉnh' }
  ];

  const kpi = revenueData?.kpi || {
    totalRevenue: 0,
    pendingRevenue: 0,
    grossOrderAmount: 0,
    avgOrderValue: 0,
    totalOrders: 0,
    paidOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    completionRate: 0
  };

  const timeline = revenueData?.timeline || [];
  const maxTimelineRevenue = useMemo(() => {
    return Math.max(...timeline.map((t) => t.revenue), 1000000);
  }, [timeline]);

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <span className="text-2xl">📈</span>
            <span>Báo Cáo Doanh Thu Bán Hàng</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Phân tích số liệu tài chính, hiệu suất bán hàng và sản phẩm chủ lực của Techshop
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchRevenue}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-2 text-sm font-semibold cursor-pointer active:scale-95"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-400' : ''}`} />
            <span>Làm mới</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 border border-sky-500/30 transition flex items-center gap-2 text-sm font-semibold cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Xuất file CSV</span>
          </button>
        </div>
      </div>

      {/* Period Filter Tabs */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {periodOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setPeriod(opt.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                period === opt.id
                  ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-700/60'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {period === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-700/60 text-xs text-slate-300">
            <span className="font-semibold text-slate-400">Chọn khoảng ngày:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
            />
            <span className="text-slate-500">đến</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
            />
            <button
              type="button"
              onClick={fetchRevenue}
              className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-lg cursor-pointer"
            >
              Áp dụng
            </button>
          </div>
        )}
      </div>

      {/* 4 Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Doanh thu thực tế */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Doanh Thu Thực Thu
            </p>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-2">
            {formatVND(kpi.totalRevenue)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {kpi.paidOrders} đơn hàng đã thanh toán thành công
            </span>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Card 2: Doanh thu chờ thu */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Doanh Thu Chờ Thu
            </p>
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-2">
            {formatVND(kpi.pendingRevenue)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Đơn COD hoặc VietQR đang chờ thanh toán</span>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Card 3: Tổng số đơn */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Tổng Số Đơn Hàng
            </p>
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
            {kpi.totalOrders} <span className="text-sm font-semibold text-slate-400">đơn</span>
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
            <span>Tỷ lệ hoàn thành giao hàng:</span>
            <strong className="text-sky-400 font-bold">{kpi.completionRate}%</strong>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-sky-500/5 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Card 4: Giá trị trung bình đơn hàng */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Giá Trị TB / Đơn (AOV)
            </p>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-indigo-400 mt-2">
            {formatVND(kpi.avgOrderValue)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
            <span>Tính trên các đơn đã thu tiền</span>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
        </div>
      </div>

      {/* Revenue Timeline Chart */}
      <div className="bg-slate-800 rounded-3xl border border-slate-700 p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700 pb-4">
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sky-400" />
              <span>Biểu Đồ Xu Hướng Doanh Thu</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Doanh thu thực tế theo mốc thời gian ({revenueData?.period?.label || '30 ngày qua'})
            </p>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Đỉnh cao nhất: <span className="text-sky-400 font-bold">{formatVND(maxTimelineRevenue)}</span>
          </div>
        </div>

        {timeline.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <p className="font-semibold text-slate-300">Không có dữ liệu đơn hàng trong khoảng thời gian này</p>
            <p className="text-xs text-slate-500 mt-1">Hãy thử chọn mốc thời gian khác</p>
          </div>
        ) : (
          <div className="pt-4">
            {/* Visual Bar Chart */}
            <div className="h-64 flex items-end gap-2 sm:gap-3 px-2 overflow-x-auto pb-6">
              {timeline.map((item, idx) => {
                const heightPercent = Math.max(
                  6,
                  Math.min(100, Math.round((item.revenue / maxTimelineRevenue) * 100))
                );
                const isHovered = hoveredBar?.date === item.date;

                return (
                  <div
                    key={item.date || idx}
                    onMouseEnter={() => setHoveredBar(item)}
                    onMouseLeave={() => setHoveredBar(null)}
                    className="flex-1 min-w-[36px] max-w-[64px] flex flex-col items-center gap-2 h-full justify-end group cursor-pointer relative"
                  >
                    {/* Tooltip on hover */}
                    {isHovered && (
                      <div className="absolute -top-16 z-20 bg-slate-950 text-white border border-slate-700 px-3 py-1.5 rounded-xl shadow-2xl text-xs whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95">
                        <p className="font-bold text-sky-400">{item.label || item.date}</p>
                        <p className="font-extrabold text-white">{formatVND(item.revenue)}</p>
                        <p className="text-[10px] text-slate-400">
                          {item.ordersCount} đơn ({item.paidOrders} đã thanh toán)
                        </p>
                      </div>
                    )}

                    {/* Bar */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-xl transition-all duration-300 ${
                        item.revenue > 0
                          ? 'bg-gradient-to-t from-sky-600 to-sky-400 group-hover:from-sky-500 group-hover:to-sky-300 shadow-md shadow-sky-500/20'
                          : 'bg-slate-700/60'
                      }`}
                    />

                    {/* X-axis label */}
                    <span className="text-[11px] font-mono text-slate-400 group-hover:text-white transition whitespace-nowrap">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Two Breakdown Columns: Payment Method & Shipping Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Payment Breakdown */}
        <div className="bg-slate-800 rounded-3xl border border-slate-700 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3.5">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-sky-400" />
              <span>Cơ Cấu Doanh Thu Theo Phương Thức</span>
            </h2>
            <span className="text-xs text-slate-400 font-semibold">Tỷ trọng thực thu</span>
          </div>

          <div className="space-y-4 pt-1">
            {(revenueData?.paymentBreakdown || []).map((pm) => (
              <div key={pm.method} className="bg-slate-900/60 rounded-2xl p-4 border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {pm.method === 'vietqr_banking' ? (
                      <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center">
                        <QrCode className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
                        <CreditCard className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-white text-sm">{pm.label}</p>
                      <p className="text-xs text-slate-400">
                        {pm.ordersCount} đơn ({pm.paidCount} đã thanh toán)
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-extrabold text-white text-sm">{formatVND(pm.revenue)}</p>
                    <p className="text-xs font-bold text-sky-400">{pm.percentage}% doanh thu</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    style={{ width: `${pm.percentage}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${
                      pm.method === 'vietqr_banking' ? 'bg-sky-500' : 'bg-amber-500'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping Status Breakdown */}
        <div className="bg-slate-800 rounded-3xl border border-slate-700 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3.5">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-400" />
              <span>Phân Bổ Theo Trạng Thái Đơn Hàng</span>
            </h2>
            <span className="text-xs text-slate-400 font-semibold">{kpi.totalOrders} đơn</span>
          </div>

          <div className="space-y-3 pt-1">
            {(revenueData?.shippingBreakdown || []).map((sb) => {
              const pct = kpi.totalOrders > 0
                ? Math.round((sb.count / kpi.totalOrders) * 100)
                : 0;

              return (
                <div key={sb.status} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-300 font-medium w-40 truncate">{sb.label}</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-900 overflow-hidden mx-2">
                    <div
                      style={{ width: `${pct}%` }}
                      className={`h-full rounded-full ${
                        sb.status === 'delivered'
                          ? 'bg-emerald-500'
                          : sb.status === 'shipping'
                          ? 'bg-sky-500'
                          : sb.status === 'processing'
                          ? 'bg-blue-500'
                          : sb.status === 'cancelled'
                          ? 'bg-rose-500'
                          : 'bg-amber-500'
                      }`}
                    />
                  </div>
                  <div className="w-20 text-right">
                    <span className="font-bold text-white">{sb.count}</span>
                    <span className="text-xs text-slate-500 ml-1">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Two Detailed Tables: Top Products & Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Products */}
        <div className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden shadow-xl">
          <div className="px-6 py-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>🏆</span>
              <span>Top Sản Phẩm Doanh Thu Cao Nhất</span>
            </h2>
            <span className="text-xs font-semibold text-sky-400">8 sản phẩm</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700/60">
                <tr>
                  <th className="px-5 py-3">Sản phẩm</th>
                  <th className="px-4 py-3 text-center">Đã bán</th>
                  <th className="px-5 py-3 text-right">Doanh thu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {(revenueData?.topProducts || []).length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-5 py-10 text-center text-slate-400 text-xs">
                      Chưa có dữ liệu sản phẩm bán ra trong kỳ này
                    </td>
                  </tr>
                ) : (
                  (revenueData?.topProducts || []).map((p, idx) => (
                    <tr key={p.sku || idx} className="hover:bg-slate-750/30">
                      <td className="px-5 py-3.5 flex items-center gap-3">
                        <span className="font-extrabold text-xs text-slate-500 w-4">
                          #{idx + 1}
                        </span>
                        <img
                          src={p.imageUrl || '/placeholder.svg'}
                          alt={p.productName}
                          className="w-10 h-10 object-cover rounded-xl bg-slate-900 border border-slate-700 shrink-0"
                          onError={(e) => {
                            e.target.src = '/placeholder.svg';
                          }}
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-white text-xs line-clamp-1">
                            {p.productName}
                          </p>
                          <p className="text-[11px] font-mono text-slate-400">{p.sku}</p>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-center font-bold text-white text-xs">
                        {p.totalSold}
                      </td>

                      <td className="px-5 py-3.5 text-right font-extrabold text-sky-400 text-xs whitespace-nowrap">
                        {formatVND(p.totalRevenue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Categories Breakdown */}
        <div className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden shadow-xl">
          <div className="px-6 py-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Doanh Thu Theo Danh Mục</span>
            </h2>
            <span className="text-xs font-semibold text-slate-400">Ngành hàng</span>
          </div>

          <div className="p-6 space-y-4">
            {(revenueData?.categoryBreakdown || []).length === 0 ? (
              <p className="text-center text-slate-400 text-xs py-10">
                Chưa có dữ liệu danh mục trong kỳ này
              </p>
            ) : (
              (revenueData?.categoryBreakdown || []).map((cat) => (
                <div key={cat.categoryName} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white">{cat.categoryName}</span>
                    <div className="text-right">
                      <span className="font-extrabold text-sky-400">{formatVND(cat.revenue)}</span>
                      <span className="text-slate-500 ml-2">({cat.itemsSold} món · {cat.percentage}%)</span>
                    </div>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                    <div
                      style={{ width: `${cat.percentage}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-500"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
