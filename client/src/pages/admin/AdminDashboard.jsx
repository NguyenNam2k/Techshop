import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';

function AdminDashboard() {
  const [stats, setStats] = useState({ customers: 0, admins: 0, managers: 0, staffs: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axiosInstance.get('/users');
        const users = res.data.users || [];
        setStats({
          customers: users.filter(u => u.role === 'customer').length,
          admins: users.filter(u => u.role === 'admin').length,
          managers: users.filter(u => u.role === 'manager').length,
          staffs: users.filter(u => u.role === 'staff').length,
          total: users.length
        });
      } catch (err) {
        console.error('Lỗi lấy thống kê:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { label: 'Tổng số tài khoản', value: stats.total,     icon: '👥', color: 'from-indigo-600 to-indigo-500' },
    { label: 'Khách hàng',       value: stats.customers, icon: '🛒', color: 'from-blue-600 to-blue-500' },
    { label: 'Quản trị viên',    value: stats.admins,    icon: '🛡️', color: 'from-red-600 to-red-500' },
    { label: 'Quản lý',          value: stats.managers,  icon: '📋', color: 'from-amber-600 to-amber-500' },
    { label: 'Nhân viên',        value: stats.staffs,    icon: '👷', color: 'from-emerald-600 to-emerald-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">📊 Tổng quan hệ thống</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
            <div className={`bg-gradient-to-r ${card.color} px-5 py-3`}>
              <span className="text-2xl">{card.icon}</span>
            </div>
            <div className="px-5 py-4">
              <p className="text-slate-400 text-sm">{card.label}</p>
              <p className="text-3xl font-bold text-white mt-1">{card.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminDashboard;
