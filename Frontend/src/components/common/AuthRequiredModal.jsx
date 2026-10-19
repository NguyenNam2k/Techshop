import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, LogIn, UserPlus, X, CheckCircle2 } from 'lucide-react';

function AuthRequiredModal({ isOpen, onClose, productName }) {
  const navigate = useNavigate();
  const location = useLocation();

  if (!isOpen) return null;

  const handleLoginClick = () => {
    onClose();
    navigate('/login', { state: { from: location.pathname } });
  };

  const handleRegisterClick = () => {
    onClose();
    navigate('/register', { state: { from: location.pathname } });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-4 pt-2">
          {/* Lock Icon */}
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[11px] font-bold tracking-wider text-amber-400 uppercase bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
              Yêu cầu đăng nhập
            </span>
            <h3 className="text-lg font-extrabold text-white mt-2.5">
              Bạn Cần Đăng Nhập Để Mua Hàng
            </h3>
            {productName ? (
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Bạn đang xem sản phẩm <strong className="text-sky-300 font-semibold">"{productName}"</strong> ở chế độ duyệt khách. Vui lòng đăng nhập tài khoản Khách hàng để thêm vào giỏ và tiến hành đặt hàng.
              </p>
            ) : (
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Trang web hiện đang mở ở chế độ xem sản phẩm. Để đặt hàng hoặc thanh toán, bạn vui lòng đăng nhập tài khoản.
              </p>
            )}
          </div>

          {/* Perks list */}
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3.5 text-left space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Nhận ưu đãi giảm giá lên tới 30%</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Lưu giỏ hàng và theo dõi hành trình đơn hàng</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Bảo hành chính hãng 12-36 tháng</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleLoginClick}
              className="w-full py-3 px-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng Nhập Ngay</span>
            </button>

            <button
              onClick={handleRegisterClick}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-sky-400" />
              <span>Chưa có tài khoản? Đăng ký mới</span>
            </button>

            <button
              onClick={onClose}
              className="w-full py-2 text-[11px] text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              Tiếp tục xem sản phẩm (Chưa mua)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthRequiredModal;
