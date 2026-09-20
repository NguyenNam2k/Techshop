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
    <div className="bg-gradient-to-b from-slate-800/60 to-slate-900/80 backdrop-blur-md rounded-2xl p-5 border border-slate-700/60 shadow-xl space-y-4">
      {}
      {isLowStock && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-950/60 border border-amber-600/50 text-amber-300 text-xs animate-pulse">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400" />
          <span>Chỉ còn <strong>{maxStock}</strong> sản phẩm trong kho! Hãy nhanh tay trước khi hết hàng.</span>
        </div>
      )}

      {}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-300">Số lượng:</span>
        
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleQuantityChange(-1)}
            disabled={quantity <= 1 || isOutOfStock}
            aria-label="Giảm số lượng"
            className={`w-9 h-9 bg-slate-800 border border-slate-700 rounded-lg
                     flex items-center justify-center text-slate-300
                     ${quantity <= 1 || isOutOfStock ? 'opacity-40 cursor-not-allowed' : 'hover:bg-cyan-950/60 hover:border-cyan-500 hover:text-cyan-300 active:scale-95'}
                     transition-all duration-150 shadow-sm`}
          >
            <Minus className="w-4 h-4" />
          </button>

          <span className="w-12 text-center font-mono font-bold text-slate-100 py-1.5 bg-slate-900/90 border border-slate-700/80 rounded-lg text-sm shadow-inner">
            {quantity}
          </span>

          <button
            type="button"
            onClick={() => handleQuantityChange(1)}
            disabled={quantity >= maxStock || isOutOfStock}
            aria-label="Tăng số lượng"
            className={`w-9 h-9 bg-slate-800 border border-slate-700 rounded-lg
                     flex items-center justify-center text-slate-300
                     ${quantity >= maxStock || isOutOfStock ? 'opacity-40 cursor-not-allowed' : 'hover:bg-cyan-950/60 hover:border-cyan-500 hover:text-cyan-300 active:scale-95'}
                     transition-all duration-150 shadow-sm`}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {}
      <div className="space-y-3 pt-1">
        <button
          onClick={() => onAddToCart && onAddToCart(quantity)}
          disabled={isOutOfStock || quantity > maxStock}
          className={`w-full flex items-center justify-center gap-2.5 px-5 py-3.5 
                   bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500
                   text-white font-bold text-sm tracking-wide rounded-xl 
                   shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]
                   transition-all duration-200
                   ${isOutOfStock || quantity > maxStock ? 'opacity-50 cursor-not-allowed filter grayscale' : ''}
                  `}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>{isOutOfStock ? 'TẠM HẾT HÀNG' : 'THÊM VÀO GIỎ HÀNG'}</span>
        </button>

        <button
          onClick={() => onBuyNow && onBuyNow(quantity)}
          disabled={isOutOfStock || quantity > maxStock}
          className={`w-full flex items-center justify-center gap-2.5 px-5 py-3.5 
                   bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-500 hover:via-pink-500 hover:to-rose-500
                   text-white font-bold text-sm tracking-wide rounded-xl 
                   shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]
                   transition-all duration-200
                   ${isOutOfStock || quantity > maxStock ? 'opacity-50 cursor-not-allowed filter grayscale' : ''}
                  `}
        >
          <Zap className="w-4 h-4" />
          <span>{isOutOfStock ? 'ĐĂNG KÝ NHẬN TIN KHI CÓ HÀNG' : 'MUA NGAY (GIAO TẬN NƠI)'}</span>
        </button>
      </div>

      {}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <Headphones className="w-3.5 h-3.5 text-cyan-400" />
          Tư vấn kỹ thuật & độ tương thích:
        </span>
        <a href="tel:19008888" className="font-mono font-semibold text-cyan-400 hover:underline">
          1900 8888 (Miễn phí)
        </a>
      </div>
    </div>
  );
};

export default AddToCartSection;