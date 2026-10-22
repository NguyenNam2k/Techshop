import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';

// Error Boundary bảo vệ nút Google tránh làm sập trang nếu Google SDK / adblocker lỗi
class GoogleErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err) {
    console.warn('[Google OAuth Error Boundary]:', err);
  }
  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

function GoogleLoginSection({ onLoginSuccess, onError, disabled }) {
  const [googleLoading, setGoogleLoading] = useState(false);

  let handleGoogleLogin = null;
  try {
    handleGoogleLogin = useGoogleLogin({
      onSuccess: async (tokenResponse) => {
        setGoogleLoading(true);
        try {
          const res = await axiosInstance.post('/auth/google', {
            credential: tokenResponse.access_token,
            isAccessToken: true,
          });
          if (res.data?.success) {
            onLoginSuccess(res.data.token, res.data.user);
          } else {
            onError(res.data?.message || 'Đăng nhập Google thất bại!');
          }
        } catch (err) {
          onError(err.response?.data?.message || 'Đăng nhập Google thất bại!');
        } finally {
          setGoogleLoading(false);
        }
      },
      onError: () => onError('Đăng nhập Google bị huỷ hoặc thất bại!'),
      flow: 'implicit',
    });
  } catch (err) {
    console.warn('Google OAuth hook init error:', err);
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          try {
            if (handleGoogleLogin) handleGoogleLogin();
          } catch (e) {
            onError('Không thể kết nối dịch vụ Google OAuth.');
          }
        }}
        disabled={disabled || googleLoading}
        className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50
          disabled:opacity-60 disabled:cursor-not-allowed text-gray-700 font-semibold
          rounded-xl py-3 text-sm transition-all duration-200 border border-gray-200 shadow-sm cursor-pointer"
      >
        {googleLoading ? (
          <>
            <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            Đang xử lý Google...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>Đăng nhập với Google</span>
          </>
        )}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-600" />
        <span className="text-slate-400 text-xs font-medium">hoặc đăng nhập bằng tài khoản</span>
        <div className="flex-1 h-px bg-slate-600" />
      </div>
    </>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [form, setForm] = useState({ account: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState('');

  const returnTarget = location.state?.from || '/catalog';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
    setApiError('');
  };

  const validate = () => {
    const errs = {};
    if (!form.account.trim()) errs.account = 'Vui lòng nhập Email hoặc Tên đăng nhập!';
    if (!form.password) errs.password = 'Vui lòng nhập Mật khẩu!';
    return errs;
  };

  const handleLoginSuccess = (token, userData) => {
    login(token, userData);
    const role = (userData?.role || '').toLowerCase();
    if (role === 'manager') {
      window.location.href = '/manager/products';
      return;
    }
    if (role === 'admin') {
      navigate('/admin', { replace: true });
      return;
    }
    navigate(returnTarget, { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      const res = await axiosInstance.post('/auth/login', {
        account: form.account.trim(),
        password: form.password,
      });

      if (res.data?.success) {
        handleLoginSuccess(res.data.token, res.data.user);
      } else {
        setApiError(res.data?.message || 'Đăng nhập thất bại!');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Tài khoản hoặc mật khẩu không chính xác!';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      {/* Nút quay lại Storefront */}
      <div className="w-full max-w-md mb-3 flex items-center justify-between text-xs font-semibold text-slate-400">
        <Link to="/" className="flex items-center gap-1.5 text-sky-400 hover:text-sky-300 transition">
          <span>← Về Trang Chủ</span>
        </Link>
        <Link to="/catalog" className="text-slate-400 hover:text-slate-200 transition">
          🛍️ Xem Catalog Sản Phẩm
        </Link>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 px-8 py-8 text-center relative">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <span className="text-3xl">💻</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Tech<span className="text-sky-300">shop</span>
          </h1>
          <p className="text-blue-100 text-xs mt-1 font-medium">Đăng nhập tài khoản điều hành &amp; mua sắm</p>
        </div>

        {/* Form */}
        <div className="px-8 py-6 space-y-5">
          {/* API Error */}
          {apiError && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 text-rose-400 text-xs flex items-center gap-2">
              <span>⚠️</span>
              <span>{apiError}</span>
            </div>
          )}

          {/* Google Login bọc trong Error Boundary */}
          <GoogleErrorBoundary>
            <GoogleLoginSection
              onLoginSuccess={handleLoginSuccess}
              onError={(msg) => setApiError(msg)}
              disabled={loading}
            />
          </GoogleErrorBoundary>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tên đăng nhập / Email */}
            <div>
              <label className="block text-slate-300 text-xs font-bold mb-1.5">
                👤 Email hoặc Tên đăng nhập
              </label>
              <input
                type="text"
                name="account"
                value={form.account}
                onChange={handleChange}
                placeholder="Nhập email hoặc username của bạn"
                autoComplete="username"
                className={`w-full bg-slate-950 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-xs border outline-none transition
                  ${errors.account ? 'border-rose-500 focus:border-rose-400' : 'border-slate-800 focus:border-sky-500'}`}
              />
              {errors.account && <p className="text-rose-400 text-[11px] mt-1">{errors.account}</p>}
            </div>

            {/* Mật khẩu */}
            <div>
              <label className="block text-slate-300 text-xs font-bold mb-1.5">
                🔑 Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu"
                  autoComplete="current-password"
                  className={`w-full bg-slate-950 text-white placeholder-slate-500 rounded-xl px-4 py-3 pr-12 text-xs border outline-none transition
                    ${errors.password ? 'border-rose-500 focus:border-rose-400' : 'border-slate-800 focus:border-sky-500'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-sm cursor-pointer"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.password && <p className="text-rose-400 text-[11px] mt-1">{errors.password}</p>}
            </div>

            {/* Nút đăng nhập */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500
                disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl py-3 text-xs
                transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 cursor-pointer active:scale-95"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang xác thực tài khoản...</span>
                </>
              ) : (
                <span>Đăng Nhập Techshop →</span>
              )}
            </button>

            {/* Link sang đăng ký */}
            <p className="text-center text-slate-400 text-xs pt-2">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="text-sky-400 hover:text-sky-300 font-bold">
                Đăng ký tài khoản mới
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
