import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Zap,
  Minus,
  Plus,
  Headphones,
  Heart,
  Bell,
  Mail,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { api } from '../../services/api';

const AddToCartSection = ({
  product,
  variant,
  selectedVariant,
  onAddToCart,
  onBuyNow,
  onToast
}) => {
  const activeVariant = variant || selectedVariant;
  const [quantity, setQuantity] = useState(1);
  const maxStock = Number(activeVariant?.stock || 0);
  const isOutOfStock = maxStock <= 0 || activeVariant?.status === 'out_of_stock';

  // Wishlist state
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Back in stock notification state
  const [notifyEmail, setNotifyEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const productId = product?.id || 1;
  const variantId = activeVariant?.id || productId;

  useEffect(() => {
    setQuantity(1);
    setSubscribed(false);
  }, [activeVariant?.id]);

  // Check if this item is in the user's wishlist
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('techgear_wishlist') || '[]');
      const exists = stored.some(
        (item) =>
          item.id === productId ||
          item.productId === productId ||
          item.variantId === variantId
      );
      setIsWishlisted(exists);
    } catch {
      // ignore
    }
  }, [productId, variantId]);

  // Pre-fill user email if logged in
  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('techgear_user') || 'null');
      if (user?.email) {
        setNotifyEmail(user.email);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= maxStock) {
      setQuantity(newQuantity);
    }
  };

  const handleToggleWishlist = async () => {
    try {
      const stored = JSON.parse(localStorage.getItem('techgear_wishlist') || '[]');
      const itemKey = `${productId}-${variantId}`;
      const existingIdx = stored.findIndex(
        (i) => (i.id === productId && i.variantId === variantId) || i.itemKey === itemKey
      );

      let updated;
      let nextState;

      if (existingIdx >= 0) {
        updated = stored.filter((_, idx) => idx !== existingIdx);
        nextState = false;
        if (onToast) onToast('Đã xóa sản phẩm khỏi danh sách yêu thích.');
      } else {
        const newItem = {
          id: productId,
          productId,
          variantId,
          itemKey,
          name: product?.name || 'Sản phẩm Techshop',
          variant: activeVariant
            ? `${activeVariant.color || ''} - ${activeVariant.spec_version || ''}`.trim()
            : 'Bản tiêu chuẩn',
          price: Number(activeVariant?.price || product?.base_price || 0),
          originalPrice: Number(product?.base_price || activeVariant?.price || 0),
          image:
            product?.thumbnail_url ||
            product?.images?.[0]?.image_url ||
            'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400',
          stock: maxStock,
          rating: 5.0,
          addedAt: new Date().toISOString()
        };
        updated = [newItem, ...stored];
        nextState = true;
        if (onToast) onToast(`Đã thêm "${product?.name || 'sản phẩm'}" vào danh sách yêu thích`);
      }

      localStorage.setItem('techgear_wishlist', JSON.stringify(updated));
      setIsWishlisted(nextState);

      // Best effort sync with backend
      try {
        await api.updateWishlist?.(updated);
      } catch {
        // silent fallback to local storage
      }
    } catch (err) {
      console.warn('Lỗi cập nhật wishlist:', err);
    }
  };

  const handleSubscribeNotify = (e) => {
    e.preventDefault();
    const cleanEmail = notifyEmail.trim();
    if (!cleanEmail) return;

    setSubscribing(true);
    setTimeout(() => {
      try {
        const subs = JSON.parse(
          localStorage.getItem('techgear_back_in_stock_subs') || '[]'
        );
        const subRecord = {
          email: cleanEmail,
          productId,
          productName: product?.name || 'Sản phẩm Techshop',
          variantId,
          variantName: activeVariant
            ? `${activeVariant.color} - ${activeVariant.spec_version}`
            : 'Tiêu chuẩn',
          date: new Date().toISOString()
        };
        localStorage.setItem(
          'techgear_back_in_stock_subs',
          JSON.stringify([subRecord, ...subs])
        );
      } catch {
        // ignore
      }
      setSubscribing(false);
      setSubscribed(true);
      if (onToast) {
        onToast(`Đã lưu email ${cleanEmail}! Sẽ thông báo cho bạn ngay khi có hàng.`);
      }
    }, 500);
  };

  return (
    <div className="space-y-4">
      {/* Chọn Số Lượng */}
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

          <span className="px-4 font-mono font-bold text-sm text-slate-100 select-none">
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

        {maxStock > 0 && maxStock <= 5 && (
          <span className="text-[11px] text-amber-400 font-bold bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg">
            Chỉ còn {maxStock} sản phẩm trong kho
          </span>
        )}
      </div>

      {/* Button Row: Thêm Vào Giỏ + Mua Ngay + Nút Heart ở mép phải */}
      <div className="space-y-3 pt-1">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Nút Thêm Giỏ Hàng */}
          <button
            type="button"
            onClick={() => onAddToCart && onAddToCart(quantity)}
            disabled={isOutOfStock || quantity > maxStock}
            className={`flex-1 py-3.5 px-4 rounded-2xl border-2 border-sky-500 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 font-extrabold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
              isOutOfStock || quantity > maxStock
                ? 'opacity-40 cursor-not-allowed filter grayscale'
                : ''
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{isOutOfStock ? 'TẠM HẾT HÀNG' : 'Thêm Vào Giỏ'}</span>
          </button>

          {/* Cụm Mua Ngay + Heart ở mép phải */}
          <div className="flex-1 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onBuyNow && onBuyNow(quantity)}
              disabled={isOutOfStock || quantity > maxStock}
              className={`flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-sky-500/25 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer ${
                isOutOfStock || quantity > maxStock
                  ? 'opacity-40 cursor-not-allowed filter grayscale'
                  : ''
              }`}
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>{isOutOfStock ? 'HẾT HÀNG' : 'Mua Ngay'}</span>
            </button>

            {/* Heart Yêu Thích Button - Gắn ở mép phải của Mua Ngay */}
            <button
              type="button"
              onClick={handleToggleWishlist}
              title={isWishlisted ? 'Bỏ lưu yêu thích' : 'Lưu vào danh sách yêu thích'}
              className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-center shrink-0 active:scale-95 shadow-sm ${
                isWishlisted
                  ? 'border-rose-500/60 bg-rose-500/15 text-rose-500 hover:bg-rose-500/25'
                  : 'border-slate-700 bg-slate-800 text-slate-400 hover:text-rose-500 hover:border-rose-400'
              }`}
            >
              <Heart
                className={`w-4 h-4 transition-transform ${
                  isWishlisted ? 'fill-rose-500 text-rose-500 scale-110' : ''
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Hộp Đăng Ký Email Nhận Thông Báo Khi Hết Hàng (Back In Stock Notification) */}
      {isOutOfStock && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
              <Bell className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
              Thông báo khi có hàng lại
            </span>
            <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-400/20 px-2 py-0.5 rounded uppercase">
              Tạm Hết Hàng
            </span>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            Phiên bản này hiện đã hết hàng trong kho. Hãy để lại địa chỉ email của bạn, Techshop sẽ tự động gửi thông báo cho bạn ngay khi có đợt hàng mới về!
          </p>

          {subscribed ? (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                Đã ghi nhận email! Hệ thống sẽ gửi thư báo cho bạn ngay khi hàng cập bến.
              </span>
            </div>
          ) : (
            <form onSubmit={handleSubscribeNotify} className="flex gap-2 pt-1">
              <div className="relative flex-1">
                <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                  placeholder="Nhập email của bạn (vd: yourname@gmail.com)..."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition"
                />
              </div>

              <button
                type="submit"
                disabled={subscribing || !notifyEmail.trim()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0 shadow shadow-amber-500/20"
              >
                {subscribing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Bell className="w-3.5 h-3.5" />
                    <span>Đăng Ký</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Thông tin hotline tư vấn */}
      <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1.5 font-medium">
          <Headphones className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          Tư vấn kỹ thuật &amp; độ tương thích:
        </span>
        <a
          href="tel:19008888"
          className="font-mono font-bold text-sky-400 hover:underline"
        >
          1900 8888 (Miễn phí)
        </a>
      </div>
    </div>
  );
};

export default AddToCartSection;
