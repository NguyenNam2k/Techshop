import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle2,
  Users
} from 'lucide-react';

const formatVND = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(n) || 0);

function AdminDashboard() {
  const [stats, setStats] = useState({ customers: 0, admins: 0, managers: 0, staffs: 0, total: 0 });
  const [revenueStats, setRevenueStats] = useState({
    totalRevenue: 0,
    pendingRevenue: 0,
    totalOrders: 0,
    paidOrders: 0,
    deliveredOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [usersRes, revenueRes, ordersRes] = await Promise.allSettled([
          axiosInstance.get('/users'),
          axiosInstance.get('/admin/revenue/overview?period=all'),
          axiosInstance.get('/admin/orders?limit=5')
        ]);

        if (usersRes.status === 'fulfilled' && usersRes.value.data.users) {
          const users = usersRes.value.data.users;
          setStats({
            customers: users.filter((u) => u.role === 'customer').length,
            admins: users.filter((u) => u.role === 'admin').length,
            managers: users.filter((u) => u.role === 'manager').length,
            staffs: users.filter((u) => u.role === 'staff').length,
            total: users.length
          });
        }

        if (revenueRes.status === 'fulfilled' && revenueRes.value.data.data?.kpi) {
          const kpi = revenueRes.value.data.data.kpi;
          setRevenueStats({
            totalRevenue: kpi.totalRevenue || 0,
            pendingRevenue: kpi.pendingRevenue || 0,
            totalOrders: kpi.totalOrders || 0,
            paidOrders: kpi.paidOrders || 0,
            deliveredOrders: kpi.deliveredOrders || 0
          });
        }

        if (ordersRes.status === 'fulfilled' && ordersRes.value.data.orders) {
          setRecentOrders(ordersRes.value.data.orders.slice(0, 5));
        }
      } catch (err) {
        console.error('Lỗi lấy thống kê dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const userCards = [
    { label: 'Tổng số tài khoản', value: stats.total, icon: '👥', color: 'from-indigo-600 to-indigo-500' },
    { label: 'Khách hàng', value: stats.customers, icon: '🛒', color: 'from-blue-600 to-blue-500' },
    { label: 'Quản trị viên', value: stats.admins, icon: '🛡️', color: 'from-red-600 to-red-500' },
    { label: 'Quản lý', value: stats.managers, icon: '📋', color: 'from-amber-600 to-amber-500' },
    { label: 'Nhân viên', value: stats.staffs, icon: '👷', color: 'from-emerald-600 to-emerald-500' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <span>📊</span>
          <span>Tổng Quan Hệ Thống Techshop</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Báo cáo nhanh các chỉ số doanh thu, khối lượng đơn hàng và người dùng hệ thống
        </p>
      </div>

      {/* 2 Big Business Highlights: Revenue & Orders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Doanh thu */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-850 rounded-3xl border border-slate-700/80 p-6 shadow-xl relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4" />
                <span>Doanh Thu Thực Thu Hệ Thống</span>
              </p>
              <p className="text-3xl font-extrabold text-white mt-2">
                {formatVND(revenueStats.totalRevenue)}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Doanh thu chờ thu: <strong className="text-amber-400">{formatVND(revenueStats.pendingRevenue)}</strong>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Đã thu từ <strong className="text-white">{revenueStats.paidOrders}</strong> đơn hàng
            </span>
            <Link
              to="/admin/revenue"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:text-sky-300 transition"
            >
              <span>Xem báo cáo doanh thu</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/15 transition-all" />
        </div>

        {/* Đơn hàng */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-850 rounded-3xl border border-slate-700/80 p-6 shadow-xl relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4" />
                <span>Tổng Khối Lượng Đơn Hàng</span>
              </p>
              <p className="text-3xl font-extrabold text-white mt-2">
                {revenueStats.totalOrders} <span className="text-base font-normal text-slate-400">đơn</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Giao thành công: <strong className="text-emerald-400">{revenueStats.deliveredOrders}</strong> đơn
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center justify-between">
            <span className="text-xs text-slate-400">Theo dõi toàn bộ đơn hàng trong hệ thống</span>
            <Link
              to="/admin/orders"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:text-sky-300 transition"
            >
              <span>Quản lý đơn hàng</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-sky-500/15 transition-all" />
        </div>
      </div>

      {/* User Statistics Grid */}
      <div>
        <h2 className="text-base font-bold text-white mb-3.5 flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-400" />
          <span>Thống kê người dùng theo vai trò</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {userCards.map((card) => (
            <div
              key={card.label}
              className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-sm hover:border-slate-600 transition"
            >
              <div className={`bg-gradient-to-r ${card.color} px-4 py-2.5`}>
                <span className="text-xl">{card.icon}</span>
              </div>
              <div className="px-4 py-3">
                <p className="text-slate-400 text-xs font-medium">{card.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders Preview */}
      <div className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden shadow-xl">
        <div className="px-6 py-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <span>📦</span>
            <span>Đơn Hàng Mới Nhất</span>
          </h2>
          <Link
            to="/admin/orders"
            className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 transition"
          >
            <span>Xem tất cả ({revenueStats.totalOrders})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-700/60">
          {recentOrders.length === 0 ? (
            <p className="text-center py-8 text-sm text-slate-400">Chưa có đơn hàng nào</p>
          ) : (
            recentOrders.map((o) => (
              <div
                key={o.id}
                className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-750/30 transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sky-400 text-sm">
                      #{o.order_code}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        o.payment_status === 'paid'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {o.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Khách hàng: <strong className="text-slate-200">{o.recipient_name}</strong> ({o.recipient_phone})
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <p className="font-extrabold text-white text-sm">{formatVND(o.final_amount)}</p>
                  <p className="text-[11px] text-slate-400">
                    {o.payment_method === 'vietqr_banking' ? 'VietQR Banking' : 'COD'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
