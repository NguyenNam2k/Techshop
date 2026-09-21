import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
  const navigate  = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ account: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState('');

  // Cập nhật field khi nhập
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
    setApiError('');
  };

  // Validate phía client
  const validate = () => {
    const errs = {};
    if (!form.account.trim()) errs.account = 'Vui lòng nhập Email hoặc Mã tài khoản!';
    if (!form.password)       errs.password = 'Vui lòng nhập Mật khẩu!';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      const res = await axiosInstance.post('/auth/login', {
        account:  form.account.trim(),
        password: form.password,
      });

      if (res.data.success) {
        login(res.data.token, res.data.user);
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Đăng nhập thất bại, vui lòng thử lại!';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth — nhận credential rồi gửi lên backend
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      setApiError('');
      try {
        // @react-oauth/google trả về access_token, cần dùng flow="auth-code" hoặc implicit
        // Dùng implicit flow: lấy credential từ Google
        const res = await axiosInstance.post('/auth/google', {
          credential: tokenResponse.access_token,
          isAccessToken: true,
        });
        if (res.data.success) {
          login(res.data.token, res.data.user);
          navigate('/dashboard', { replace: true });
        }
      } catch (err) {
        setApiError(err.response?.data?.message || 'Đăng nhập Google thất bại!');
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => setApiError('Đăng nhập Google bị huỷ hoặc thất bại!'),
    flow: 'implicit',
  });

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      {/* Card */}
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl">💻</span>
          </div>
          <h1 className="text-2xl font-bold text-white font-['Outfit']">
            Tech<span className="text-blue-200">shop</span>
          </h1>
          <p className="text-blue-100 text-sm mt-1">Đăng nhập vào tài khoản của bạn</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
          {/* API Error */}
          {apiError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
              ⚠️ {apiError}
            </div>
          )}

          {/* Nút Google */}
          <button
            type="button"
            onClick={() => handleGoogleLogin()}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50
              disabled:opacity-60 disabled:cursor-not-allowed text-gray-700 font-semibold
              rounded-xl py-3 text-sm transition-all duration-200 border border-gray-200 shadow-sm"
          >
            {googleLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Đăng nhập với Google
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-600" />
            <span className="text-slate-500 text-xs">hoặc đăng nhập bằng email</span>
            <div className="flex-1 h-px bg-slate-600" />
          </div>

          {/* Email / Mã tài khoản */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5">
              📧 Email / Mã tài khoản
            </label>
            <input
              type="text"
              name="account"
              value={form.account}
              onChange={handleChange}
              placeholder="Nhập email hoặc mã tài khoản"
              autoComplete="username"
              className={`w-full bg-slate-700 text-white placeholder-slate-400 rounded-xl px-4 py-3 text-sm border outline-none transition
                ${errors.account ? 'border-red-500 focus:border-red-400' : 'border-slate-600 focus:border-blue-500'}`}
            />
            {errors.account && <p className="text-red-400 text-xs mt-1">{errors.account}</p>}
          </div>

          {/* Mật khẩu */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5">
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
                className={`w-full bg-slate-700 text-white placeholder-slate-400 rounded-xl px-4 py-3 pr-12 text-sm border outline-none transition
                  ${errors.password ? 'border-red-500 focus:border-red-400' : 'border-slate-600 focus:border-blue-500'}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-lg"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
          </div>

          {/* Nút đăng nhập */}
          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500
              disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 text-sm
              transition-all duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang đăng nhập...
              </>
            ) : (
              'Đăng Nhập →'
            )}
          </button>

          {/* Link sang đăng ký */}
          <p className="text-center text-slate-400 text-sm">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium">
              Đăng ký ngay
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
