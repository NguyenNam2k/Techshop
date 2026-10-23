import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Truck,
  Sparkles,
  CheckCircle2,
  CreditCard
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import AuthRequiredModal from '../../components/common/AuthRequiredModal';
import { isSingleConfigurationProduct } from '../../components/pdp/VariantSelector';

const FALLBACK_IMAGE = '/placeholder.svg';

const formatVND = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

export default function CartPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const {
    cartItems = [],
    loading = false,
    updateQuantity,
    updateItemVariant,
    removeItem,
    clearCart,
    cartCount = 0,
    subtotal = 0
  } = useCart();

  if (loading && cartItems.length === 0) {
    return (
      <div className="min-h-[70vh] bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 text-center space-y-3">
          <div className="w-10 h-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-300">Đang đồng bộ giỏ hàng của bạn...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Top Progress Stepper */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-slate-800">
          <div>
            <nav className="flex items-center gap-2 text-xs text-slate-400 mb-2">
              <Link to="/" className="hover:text-sky-400 transition">
                Trang chủ
              </Link>
              <span>/</span>
              <span className="text-slate-200 font-semibold">Giỏ hàng của bạn</span>
            </nav>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
              <ShoppingBag className="w-7 h-7 text-sky-400" />
              <span>Giỏ Hàng</span>
              <span className="text-sm font-bold px-3 py-1 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30">
                {cartCount} sản phẩm
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sky-500/15 border border-sky-500/40 text-sky-400">
              <span className="w-5 h-5 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center text-[11px]">
                1
              </span>
              <span>Giỏ hàng</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600" />
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[11px]">
                2
              </span>
              <span>Thanh toán</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-500">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center text-[11px]">
                3
              </span>
              <span>Hoàn tất</span>
            </div>
          </div>
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-12 text-center max-w-xl mx-auto my-8 space-y-5 shadow-2xl">
            <div className="w-20 h-20 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-slate-100">Giỏ hàng của bạn đang trống</h2>
              <p className="text-slate-400 text-sm">
                Khám phá ngay các mẫu Laptop Gaming, Bàn phím cơ, Chuột Esports và Linh kiện PC hiệu năng cao tại Techshop.
              </p>
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-sky-500/25 transition"
            >
              <span>Khám phá sản phẩm ngay</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Cart Items List */}
            <div className="lg:col-span-8 space-y-4">
              {/* Free Express Shipping Banner */}
              <div className="bg-gradient-to-r from-sky-500/10 via-blue-600/10 to-indigo-600/10 border border-sky-500/30 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      <span>Miễn phí Giao Hỏa Tốc 2H nội thành Hà Nội &amp; TP.HCM</span>
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Áp dụng cho tất cả đơn hàng Gaming Gear, Laptop &amp; Linh kiện PC chính hãng.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 shrink-0 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa tất cả</span>
                </button>
              </div>

              {/* Cart Items */}
              <div className="space-y-3">
                {cartItems.map((item) => {
                  const isSingleConfig = isSingleConfigurationProduct({
                    categorySlug: item.categorySlug || item.category_slug,
                    categoryId: item.categoryId || item.category_id,
                    categoryName: item.categoryName || item.category_name,
                    name: item.name || item.product_name
                  });

                  const hasMultipleVariants =
                    !isSingleConfig && Array.isArray(item.variants) && item.variants.length > 1;
                  const itemSubtotal = Number(item.price || 0) * Number(item.quantity || 1);

                  return (
                    <div
                      key={item.id}
                      className="bg-slate-900/90 hover:bg-slate-900 rounded-2xl border border-slate-800 hover:border-slate-700 p-4 sm:p-5 transition flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-lg"
                    >
                      {/* Product Thumbnail */}
                      <Link
                        to={`/products/${item.slug || item.productId || item.id}`}
                        className="w-24 h-24 rounded-xl bg-slate-950 border border-slate-800 p-2 flex items-center justify-center shrink-0 overflow-hidden group"
                      >
                        <img
                          src={item.image || FALLBACK_IMAGE}
                          alt={item.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = FALLBACK_IMAGE;
                          }}
                        />
                      </Link>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0 space-y-1.5 w-full">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/30 text-sky-400 text-[10px] font-bold uppercase">
                              {item.brand || 'TECHSHOP'}
                            </span>
                            {item.sku && (
                              <span className="text-[11px] text-slate-400 font-mono">
                                SKU: {item.sku}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition cursor-pointer"
                            title="Xóa khỏi giỏ hàng"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <Link
                          to={`/products/${item.slug || item.productId || item.id}`}
                          className="text-base font-bold text-slate-100 hover:text-sky-400 transition line-clamp-1 block"
                        >
                          {item.name}
                        </Link>

                        {/* Variant Info / Switcher (Chỉ hiển thị cho phụ kiện/gear có nhiều màu; KHÔNG hiển thị cho linh kiện & laptop vì là cấu hình độc lập) */}
                        {hasMultipleVariants ? (
                          <div className="flex items-center gap-2 pt-0.5">
                            <span className="text-[11px] text-slate-400">Phiên bản:</span>
                            <select
                              value={item.variantId}
                              onChange={(e) => updateItemVariant(item.id, Number(e.target.value))}
                              className="bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-200 outline-none cursor-pointer"
                            >
                              {item.variants.map((variant) => (
                                <option
                                  key={variant.id}
                                  value={variant.id}
                                  disabled={
                                    variant.id !== item.variantId &&
                                    (variant.status === 'out_of_stock' || Number(variant.stock) <= 0)
                                  }
                                >
                                  {variant.color} — {variant.spec_version} ({formatVND(variant.price)})
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : !isSingleConfig && item.variant && item.variant !== 'Tiêu chuẩn' && item.variant !== 'Bản tiêu chuẩn' ? (
                          <div className="text-xs text-slate-400">
                            Phiên bản:{' '}
                            <span className="text-slate-300 font-medium">{item.variant}</span>
                          </div>
                        ) : null}

                        {/* Price & Quantity Bar */}
                        <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl overflow-hidden">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, -1)}
                                className="w-8 h-8 flex items-center justify-center text-slate-300 hover:bg-slate-800 hover:text-white transition"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-9 text-center text-xs font-bold text-slate-100 select-none">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, 1)}
                                disabled={item.quantity >= (item.stock || 99)}
                                className="w-8 h-8 flex items-center justify-center text-slate-300 hover:bg-slate-800 hover:text-slate-100 disabled:opacity-40 transition"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <span className="text-[11px] text-emerald-400 font-medium">
                              Kho còn: {item.stock || 15}
                            </span>
                          </div>

                          <div className="text-right">
                            <div className="text-base font-extrabold text-sky-400">
                              {formatVND(itemSubtotal)}
                            </div>
                            {item.quantity > 1 && (
                              <div className="text-[11px] text-slate-400">
                                {formatVND(item.price)} / sản phẩm
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-sky-400 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Tiếp tục mua thêm sản phẩm khác</span>
                </Link>
              </div>
            </div>

            {/* Right Column: Order Summary Card */}
            <div className="lg:col-span-4 lg:sticky lg:top-24">
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-5 shadow-2xl">
                <h2 className="text-base font-extrabold text-slate-100 uppercase tracking-wider border-b border-slate-800 pb-3.5">
                  Tóm Tắt Đơn Hàng
                </h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-slate-400">
                    <span>Tạm tính ({cartCount} sản phẩm)</span>
                    <span className="font-bold text-slate-100">{formatVND(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Phí vận chuyển nội thành</span>
                    <span className="text-emerald-400 font-bold">Miễn phí (0₫)</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Mã giảm giá</span>
                    <span className="text-sky-400 text-xs font-semibold">
                      Chọn ở bước thanh toán
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-bold text-slate-200">Tổng thanh toán</span>
                    <span className="text-2xl font-extrabold text-sky-400">
                      {formatVND(subtotal)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 text-right mt-1">
                    (Đã bao gồm thuế VAT 10% nếu có)
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!user) {
                      setShowAuthModal(true);
                      return;
                    }
                    navigate('/checkout');
                  }}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold text-sm shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition active:scale-[0.99] cursor-pointer"
                >
                  <span>Tiến Hành Thanh Toán</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Guarantees */}
                <div className="pt-3 border-t border-slate-800/80 space-y-2.5 text-xs text-slate-400">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Cam kết chính hãng 100%, nguyên seal nhà sản xuất</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Hỗ trợ thanh toán COD &amp; Chuyển khoản tự động VietQR</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Bảo hành 1 đổi 1 trong 30 ngày đầu nếu lỗi phần cứng</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal yêu cầu đăng nhập khi khách bấm thanh toán */}
      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}