import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Lock, ShieldCheck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

function formatVND(amount) {
  if (!amount && amount !== 0) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function CartDrawer() {
  const { cartItems, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isCartOpen) return null;

  const handleCheckoutClick = () => {
    if (!user) {
      setIsCartOpen(false);
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    if (user.role === 'admin' || user.role === 'manager') {
      alert('Tài khoản Quản lý / Quản trị viên không thể tạo đơn hàng mua sắm cá nhân. Vui lòng đăng nhập bằng tài khoản Khách hàng (Customer)!');
      return;
    }

    alert(`🎉 Đang tiến hành tạo đơn hàng cho ${user.name} với tổng tiền ${formatVND(cartTotal)}! Hệ thống tích hợp VietQR và xử lý kho tức thì.`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 text-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-sky-400" />
              <h2 className="text-base font-bold text-white">Giỏ hàng của bạn</h2>
              <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                {cartItems.reduce((acc, it) => acc + (it.quantity || 1), 0)} món
              </span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-3xl">
                  🛒
                </div>
                <div>
                  <h3 className="text-base font-bold text-white mb-1">Giỏ hàng đang trống</h3>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Hãy dạo quanh cửa hàng và chọn các linh kiện, thiết bị công nghệ bạn yêu thích!
                  </p>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Khám phá sản phẩm
                </button>
              </div>
            ) : (
              cartItems.map((item) => {
                const itemPrice = item.variant?.price || item.product?.base_price || 0;
                return (
                  <div
                    key={`${item.product?.id}-${item.variantId}`}
                    className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex gap-3 items-center"
                  >
                    <img
                      src={item.product?.thumbnail_url || 'https://via.placeholder.com/150'}
                      alt={item.product?.name}
                      className="w-16 h-16 object-contain rounded-xl bg-slate-900 p-1 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white truncate" title={item.product?.name}>
                        {item.product?.name}
                      </h4>
                      {item.variant && (
                        <p className="text-[11px] text-sky-400 truncate mt-0.5">
                          {item.variant.sku} {item.variant.ram ? `• ${item.variant.ram}` : ''} {item.variant.storage ? `• ${item.variant.storage}` : ''}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs font-mono font-bold text-sky-400">
                          {formatVND(itemPrice)}
                        </span>
                        <div className="flex items-center border border-slate-700 rounded-lg bg-slate-900">
                          <button
                            onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                            className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-mono font-bold text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                            className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.variantId)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                      title="Xóa khỏi giỏ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer & Checkout */}
          {cartItems.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/95 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Tạm tính ({cartItems.reduce((acc, it) => acc + (it.quantity || 1), 0)} món):</span>
                <span className="text-base font-bold text-sky-400 font-mono">
                  {formatVND(cartTotal)}
                </span>
              </div>

              {/* Guest Warning Banner if not logged in */}
              {!user && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px]">
                  <Lock className="w-4 h-4 flex-shrink-0 text-amber-400 mt-0.5" />
                  <span>
                    <strong>Chưa đăng nhập:</strong> Quý khách chỉ có thể xem giỏ hàng tạm tính. Cần đăng nhập để tiến hành đặt hàng.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-2 pt-1">
                <button
                  onClick={handleCheckoutClick}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-lg ${
                    user
                      ? 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-sky-500/25'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold shadow-amber-500/20'
                  }`}
                >
                  {user ? (
                    <>
                      <span>Tiến hành Đặt hàng</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Đăng nhập để Mua hàng</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={clearCart}
                    className="text-[11px] text-slate-500 hover:text-slate-300 transition cursor-pointer"
                  >
                    Xóa tất cả
                  </button>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Thanh toán an toàn 100%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CartDrawer;
