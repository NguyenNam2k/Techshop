import React, { useState } from 'react';
import { ShoppingCart, Zap, Minus, Plus, AlertCircle, Headphones } from 'lucide-react';

const AddToCartSection = ({ variant, onAddToCart, onBuyNow }) => {
  const [quantity, setQuantity] = useState(1);
  const maxStock = variant?.stock || 0;
  const isOutOfStock = maxStock === 0;
  const isLowStock = maxStock > 0 && maxStock <= 5;

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= maxStock) {
      setQuantity(newQuantity);
    }
  };

  return (
    <div className="space-y-4">
      {isLowStock && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs animate-pulse">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <span>Chỉ còn <strong>{maxStock}</strong> sản phẩm trong kho! Hãy nhanh tay đặt hàng.</span>
        </div>
      )}

      <div className="flex items-center gap-4">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Số lượng:</span>
        <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-100 dark:bg-slate-800 p-1 transition-colors">
          <button
            type="button"
            onClick={() => handleQuantityChange(-1)}
            disabled={quantity <= 1 || isOutOfStock}
            aria-label="Giảm số lượng"
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <span className="px-4 font-mono font-bold text-sm text-slate-900 dark:text-white select-none">
            {quantity}
          </span>

          <button
            type="button"
            onClick={() => handleQuantityChange(1)}
            disabled={quantity >= maxStock || isOutOfStock}
            aria-label="Tăng số lượng"
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-3 pt-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => onAddToCart && onAddToCart(quantity)}
            disabled={isOutOfStock || quantity > maxStock}
            className={`py-3.5 px-4 rounded-2xl border-2 border-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-sky-600 dark:text-sky-400 font-extrabold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
              isOutOfStock || quantity > maxStock ? 'opacity-40 cursor-not-allowed filter grayscale' : ''
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{isOutOfStock ? 'TẠM HẾT HÀNG' : 'Thêm Vào Giỏ Hàng'}</span>
          </button>

          <button
            onClick={() => onBuyNow && onBuyNow(quantity)}
            disabled={isOutOfStock || quantity > maxStock}
            className={`py-3.5 px-4 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-sky-500/20 transition flex items-center justify-center gap-2 cursor-pointer ${
              isOutOfStock || quantity > maxStock ? 'opacity-40 cursor-not-allowed filter grayscale' : ''
            }`}
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>{isOutOfStock ? 'ĐĂNG KÝ KHI CÓ HÀNG' : 'Mua Ngay VietQR'}</span>
          </button>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 transition-colors">
        <span className="flex items-center gap-1.5">
          <Headphones className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          Tư vấn kỹ thuật & độ tương thích:
        </span>
        <a href="tel:19008888" className="font-mono font-bold text-sky-600 dark:text-sky-400 hover:underline">
          1900 8888 (Miễn phí)
        </a>
      </div>
    </div>
  );
};

export default AddToCartSection;