import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';

// Màu badge theo role
const ROLE_STYLES = {
  customer: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  admin:    'bg-red-500/20 text-red-300 border-red-500/30',
  manager:  'bg-amber-500/20 text-amber-300 border-amber-500/30',
  staff:    'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

function DashboardPage() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [apiMsg, setApiMsg] = useState('');
  const [apiLoading, setApiLoading] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Gọi thủ công /api/auth/me để kiểm tra token
  const handleVerifyToken = async () => {
    setApiLoading(true);
    setApiMsg('');
    try {
      const res = await axiosInstance.get('/auth/me');
      if (res.data.success) {
        setApiMsg(`✅ Token hợp lệ! Xin chào ${res.data.user.name} (${res.data.user.role?.toUpperCase()})`);
      }
    } catch {
      setApiMsg('❌ Token không hợp lệ hoặc đã hết hạn!');
    } finally {
      setApiLoading(false);
    }
  };

  const roleStyle = ROLE_STYLES[user?.role] || ROLE_STYLES.customer;

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-slate-700 to-slate-600 px-8 py-8 text-center">
          <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-blue-500/30">
            <span className="text-4xl">🧑‍💻</span>
          </div>
          <h2 className="text-xl font-bold text-white">
            Xin chào, <span className="text-blue-300">{user?.name || 'User'}</span>!
          </h2>
          <span className={`inline-block mt-2 px-3 py-0.5 rounded-full text-xs font-semibold border tracking-widest uppercase ${roleStyle}`}>
            {user?.role || 'customer'}
          </span>
        </div>

        {/* Info Grid */}
        <div className="px-8 pt-6 grid grid-cols-2 gap-3">
          <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600">
            <p className="text-slate-400 text-xs mb-1">📧 Email tài khoản</p>
            <p className="text-white text-sm font-medium truncate">{user?.email}</p>
          </div>
          <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600">
            <p className="text-slate-400 text-xs mb-1">🪪 ID Người dùng</p>
            <p className="text-white text-sm font-medium">#{user?.id}</p>
          </div>
        </div>

        {/* JWT Token Box */}
        <div className="px-8 pt-4">
          <div className="bg-slate-900/70 rounded-xl p-4 border border-slate-600">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-300 text-xs font-medium">🔑 JWT Bearer Token</span>
              <button
                onClick={() => { navigator.clipboard.writeText(token); }}
                className="text-blue-400 hover:text-blue-300 text-xs"
              >
                📋 Sao chép
              </button>
            </div>
            <p className="text-slate-500 text-xs break-all font-mono leading-relaxed line-clamp-3">
              {token}
            </p>
          </div>
        </div>

        {/* API Message */}
        {apiMsg && (
          <div className="px-8 pt-3">
            <div className="bg-slate-700/50 rounded-xl px-4 py-3 text-slate-300 text-sm border border-slate-600">
              {apiMsg}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-8 py-6 flex flex-col gap-3">
          <button
            onClick={handleVerifyToken}
            disabled={apiLoading}
            className="w-full bg-slate-700 hover:bg-slate-600 disabled:opacity-60 text-white font-medium rounded-xl py-3 text-sm
              transition-all duration-200 flex items-center justify-center gap-2 border border-slate-600"
          >
            {apiLoading
              ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang kiểm tra...</>
              : '🔄 Kiểm tra API (/api/auth/me)'
            }
          </button>

          <button
            onClick={handleLogout}
            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium rounded-xl py-3 text-sm
              transition-all duration-200 border border-red-500/30"
          >
            🚪 Đăng Xuất
          </button>
        </div>

      </div>
    </div>
  );
}

export default DashboardPage;
