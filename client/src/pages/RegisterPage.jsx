import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';

function RegisterPage() {
  const navigate  = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', password: '', confirmPassword: '',
  });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [showCpw, setShowCpw] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
    setApiError('');
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim() || form.name.trim().length < 2)
      errs.name = 'Họ và tên phải có ít nhất 2 ký tự!';

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!form.email.trim())
      errs.email = 'Vui lòng nhập Email!';
    else if (!emailRegex.test(form.email.trim()))
      errs.email = 'Địa chỉ Email không đúng định dạng!';

    if (form.phone && !/^[0-9]{9,11}$/.test(form.phone.trim()))
      errs.phone = 'Số điện thoại không hợp lệ (9-11 chữ số)!';

    if (!form.password)
      errs.password = 'Vui lòng nhập Mật khẩu!';
    else if (form.password.length < 6)
      errs.password = 'Mật khẩu phải có ít nhất 6 ký tự!';

    if (!form.confirmPassword)
      errs.confirmPassword = 'Vui lòng xác nhận Mật khẩu!';
    else if (form.password !== form.confirmPassword)
      errs.confirmPassword = 'Mật khẩu xác nhận không trùng khớp!';

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      const res = await axiosInstance.post('/auth/register', {
        name:    form.name.trim(),
        email:   form.email.trim(),
        phone:   form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
        password: form.password,
      });

      if (res.data.success) {
        login(res.data.token, res.data.user);
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Đăng ký thất bại, vui lòng thử lại!';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Helper: render một input field
  const Field = ({ label, name, type = 'text', placeholder, required = false, rightElement }) => (
    <div>
      <label className="block text-slate-300 text-sm font-medium mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div className="relative">
        <input
          type={type}
          name={name}
          value={form[name]}
          onChange={handleChange}
          placeholder={placeholder}
          className={`w-full bg-slate-700 text-white placeholder-slate-400 rounded-xl px-4 py-3 text-sm border outline-none transition
            ${rightElement ? 'pr-12' : ''}
            ${errors[name] ? 'border-red-500 focus:border-red-400' : 'border-slate-600 focus:border-blue-500'}`}
        />
        {rightElement}
      </div>
      {errors[name] && <p className="text-red-400 text-xs mt-1">{errors[name]}</p>}
    </div>
  );

  const EyeBtn = ({ show, onToggle }) => (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-lg"
    >
      {show ? '🙈' : '👁️'}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl">👤</span>
          </div>
          <h1 className="text-2xl font-bold text-white font-['Outfit']">
            Tạo Tài Khoản
          </h1>
          <p className="text-emerald-100 text-sm mt-1">Đăng ký để trở thành Khách hàng Techshop</p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
          {apiError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
              ⚠️ {apiError}
            </div>
          )}

          <Field label="👤 Họ và tên" name="name" placeholder="Nguyễn Văn A" required />
          <Field label="📧 Địa chỉ Email" name="email" type="email" placeholder="example@techshop.com" required />

          {/* Phone + Address — 2 cột */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="📱 Số điện thoại" name="phone" placeholder="0901234567" />
            <Field label="🏠 Địa chỉ" name="address" placeholder="Hà Nội / TP.HCM" />
          </div>

          <Field
            label="🔑 Mật khẩu" name="password"
            type={showPw ? 'text' : 'password'}
            placeholder="Tối thiểu 6 ký tự" required
            rightElement={<EyeBtn show={showPw} onToggle={() => setShowPw(v => !v)} />}
          />
          <Field
            label="✅ Xác nhận mật khẩu" name="confirmPassword"
            type={showCpw ? 'text' : 'password'}
            placeholder="Nhập lại mật khẩu" required
            rightElement={<EyeBtn show={showCpw} onToggle={() => setShowCpw(v => !v)} />}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500
              disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 text-sm
              transition-all duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang tạo tài khoản...
              </>
            ) : (
              '✅ Tạo Tài Khoản Khách Hàng'
            )}
          </button>

          <p className="text-center text-slate-400 text-sm">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
              Đăng nhập
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default RegisterPage;
