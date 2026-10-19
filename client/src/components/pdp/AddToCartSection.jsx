import React, { useState } from 'react';
import { ShoppingCart, Zap, Minus, Plus, AlertCircle, Headphones, Lock } from 'lucide-react';

const AddToCartSection = ({ variant, onAddToCart, onBuyNow, user, onRequireLogin }) => {
  const [quantity, setQuantity] = useState(1);
  const maxStock = variant?.stock || 0;
  const isOutOfStock = maxStock === 0;
  const isLowStock = maxStock > 0 && maxStock <= 5;
  const isLoggedIn = Boolean(user);

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= maxStock) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCartClick = () => {
    if (!isLoggedIn) {
      if (onRequireLogin) onRequireLogin('add_to_cart');
      return;
    }
    if (onAddToCart) onAddToCart(quantity);
  };

  const handleBuyNowClick = () => {
    if (!isLoggedIn) {
      if (onRequireLogin) onRequireLogin('buy_now');
      return;
    }
    if (onBuyNow) onBuyNow(quantity);
  };

  return (
    <div className="space-y-4">
      {/* Thông báo chế độ khách xem hàng */}
      {!isLoggedIn && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs shadow-sm">
          <Lock className="w-4 h-4 flex-shrink-0 text-amber-400 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-amber-200">
              Chế độ duyệt sản phẩm (Chưa đăng nhập)
            </span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Bạn đang xem chi tiết thông số và bảng giá. Vui lòng đăng nhập tài khoản Khách hàng để thêm vào giỏ và đặt mua sản phẩm này.
            </p>
          </div>
        </div>
      )}

      {isLowStock && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs animate-pulse">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400" />
          <span>Chỉ còn <strong>{maxStock}</strong> sản phẩm trong kho! Hãy nhanh tay đặt hàng.</span>
        </div>
      )}

      <div className="flex items-center gap-4">
        <span className="text-xs font-bold text-slate-300">Số lượng:</span>
        <div className="flex items-center border border-slate-700 rounded-xl bg-slate-800 p-1">
          <button
            type="button"
            onClick={() => handleQuantityChange(-1)}
            disabled={quantity <= 1 || isOutOfStock}
            aria-label="Giảm số lượng"
            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <span className="px-4 font-mono font-bold text-sm text-white select-none">
            {quantity}
          </span>

          <button
            type="button"
            onClick={() => handleQuantityChange(1)}
            disabled={quantity >= maxStock || isOutOfStock}
            aria-label="Tăng số lượng"
            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-3 pt-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Nút 1: Thêm vào giỏ */}
          <button
            onClick={handleAddToCartClick}
            disabled={isOutOfStock || quantity > maxStock}
            className={`py-3.5 px-4 rounded-2xl border-2 border-sky-500 hover:bg-sky-500/10 text-sky-400 font-extrabold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
              isOutOfStock || quantity > maxStock ? 'opacity-40 cursor-not-allowed filter grayscale' : ''
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{isOutOfStock ? 'TẠM HẾT HÀNG' : 'Thêm Vào Giỏ Hàng'}</span>
          </button>

          {/* Nút 2: Mua ngay / Đăng nhập để mua */}
          <button
            onClick={handleBuyNowClick}
            disabled={isOutOfStock || quantity > maxStock}
            className={`py-3.5 px-4 rounded-2xl font-extrabold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
              isOutOfStock || quantity > maxStock
                ? 'opacity-40 cursor-not-allowed filter grayscale bg-slate-800 text-slate-500'
                : isLoggedIn
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-sky-500/20'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20 font-black'
            }`}
          >
            {isLoggedIn ? (
              <>
                <Zap className="w-4 h-4 fill-white" />
                <span>{isOutOfStock ? 'ĐĂNG KÝ KHI CÓ HÀNG' : 'Mua Ngay'}</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Đăng Nhập Để Mua Ngay</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <Headphones className="w-3.5 h-3.5 text-sky-400" />
          Tư vấn kỹ thuật & độ tương thích:
        </span>
        <a href="tel:19008888" className="font-mono font-bold text-sky-400 hover:underline">
          1900 8888 (Miễn phí)
        </a>
      </div>
    </div>
  );
};

export default AddToCartSection;
