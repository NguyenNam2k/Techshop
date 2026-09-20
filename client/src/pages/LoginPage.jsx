import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
  const navigate  = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ account: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
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
      // Backend tự xác định role — không cần truyền roleType
      const res = await axiosInstance.post('/auth/login', {
        account:  form.account.trim(),
        password: form.password,
      });

      if (res.data.success) {
        login(res.data.token, res.data.user); // Lưu vào AuthContext + localStorage
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Đăng nhập thất bại, vui lòng thử lại!';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

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
            disabled={loading}
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
