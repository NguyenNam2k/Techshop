import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Lock, Mail, ShieldCheck, UserCheck, ArrowRight, User } from 'lucide-react';
import {
  useAuth,
  ROLES,
  getDashboardRouteForRole,
  getPostLoginRouteForRole
} from '../../context/AuthContext';

export default function AuthModal() {
  const navigate = useNavigate();
  const {
    isAuthOpen,
    setIsAuthOpen,
    loginWithPassword,
    loginWithTwoFactor,
    user,
    logout,
    cartMergeError
  } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('tu.tran@techshop.vn');
  const [password, setPassword] = useState('123456');
  const [challengeToken, setChallengeToken] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loginError, setLoginError] = useState('');

  if (!isAuthOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const result = challengeToken
        ? await loginWithTwoFactor(challengeToken, verificationCode)
        : await loginWithPassword(email, password);
      if (result?.requiresTwoFactor) {
        setChallengeToken(result.challengeToken);
        setVerificationCode('');
        setLoginError('Nhập mã 6 chữ số từ ứng dụng xác thực của bạn.');
        return;
      }
      const loggedUser = result;
      // A failed guest-cart merge must not be reported as a successful login
      // transition: keep the modal open so the message is actually read.
      if (loggedUser?.cartMergeError) {
        setLoginError(loggedUser.cartMergeError);
        return;
      }
      setIsAuthOpen(false);
      navigate(getPostLoginRouteForRole(loggedUser?.role || 'customer'), { replace: true });
    } catch (err) {
      setLoginError(err.message || 'Đăng nhập thất bại');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-[#0B0F17] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
              <User className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              {user ? 'Thông Tin Tài Khoản' : isSignUp ? 'Tạo Tài Khoản TechShop' : 'Đăng Nhập TechShop'}
            </h3>
          </div>
          <button
            onClick={() => setIsAuthOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {user ? (
            <div className="text-center space-y-4">
              {cartMergeError && (
                <div
                  role="alert"
                  className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-left text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
                >
                  {cartMergeError}
                </div>
              )}
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-20 h-20 rounded-full mx-auto object-cover border-4 border-sky-500 shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 rounded-full mx-auto bg-sky-600 text-white font-bold flex items-center justify-center text-2xl shadow-lg">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">{user.name}</h4>
                <p className="text-sm text-slate-500">{user.email}</p>
                <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                  Vai trò: {ROLES[user.role]?.label || user.role}
                </span>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap justify-center gap-2.5">
                <button
                  onClick={() => {
                    navigate('/profile/');
                    setIsAuthOpen(false);
                  }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl hover:border-sky-500 transition cursor-pointer"
                >
                  Hồ sơ cá nhân
                </button>
                <button
                  onClick={() => {
                    navigate(getDashboardRouteForRole(user.role));
                    setIsAuthOpen(false);
                  }}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-xl transition cursor-pointer"
                >
                  Mở {user.role === 'admin' ? 'Admin Dashboard' : user.role === 'manager' ? 'Manager Dashboard' : user.role === 'staff' ? 'Staff Dashboard' : 'Customer Dashboard'}
                </button>
                <button
                  onClick={() => {
                    logout();
                    setIsAuthOpen(false);
                  }}
                  className="px-4 py-2 bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 font-semibold text-xs rounded-xl hover:bg-rose-100 transition cursor-pointer"
                >
                  Đăng Xuất
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Google SSO Button */}
              <button
                type="button"
                onClick={() => {
                  handleSubmit({ preventDefault: () => {} });
                }}
                className="w-full py-2.5 px-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Đăng nhập nhanh với Google</span>
              </button>

              <div className="flex items-center my-3">
                <div className="flex-1 border-t border-slate-200 dark:border-slate-800"></div>
                <span className="px-3 text-[11px] text-slate-400 uppercase font-semibold">Hoặc email</span>
                <div className="flex-1 border-t border-slate-200 dark:border-slate-800"></div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    disabled={Boolean(challengeToken)}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@techshop.vn"
                    className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {challengeToken ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Mã xác minh</label>
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    className="w-full px-4 py-2 text-sm tracking-[0.35em] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => { setChallengeToken(''); setVerificationCode(''); setLoginError(''); }}
                    className="mt-2 text-xs text-sky-600 dark:text-sky-400 hover:underline"
                  >
                    Quay lại đăng nhập bằng mật khẩu
                  </button>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Mật khẩu</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
              )}

              {loginError && (
                <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isSignUp ? 'Đăng Ký' : challengeToken ? 'Xác Minh & Đăng Nhập' : 'Đăng Nhập'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-xs text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  {isSignUp ? 'Đã có tài khoản? Đăng nhập ngay' : 'Chưa có tài khoản? Đăng ký ngay'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
