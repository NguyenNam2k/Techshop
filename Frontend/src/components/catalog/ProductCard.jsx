import { Link } from 'react-router-dom';
import { getCategoryDisplayName } from '../../constants/categories';

function formatVND(amount) {
  if (!amount && amount !== 0) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function ProductCard({ product }) {
  const {
    id,
    name,
    brand,
    thumbnail_url,
    pricing,
    inventory,
    category
  } = product;

  return (
    <Link
      to={`/products/${id}`}
      className="group motion-card glow-card-hover bg-slate-800 rounded-2xl border border-slate-700/80 hover:border-sky-500/60 hover:shadow-xl hover:shadow-sky-500/10 flex flex-col overflow-hidden relative cursor-pointer active:scale-[0.98] transition-all duration-300"
    >
      {/* Discount Badge */}
      {pricing?.discount_percent > 0 && (
        <span className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-10 bg-rose-500 text-white text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full shadow-md transition-transform duration-300 group-hover:scale-105">
          -{pricing.discount_percent}%
        </span>
      )}

      {/* Stock Status Badge */}
      <span
        className={`absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-10 text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-full border backdrop-blur-md transition-all ${
          inventory?.in_stock
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            : 'bg-slate-700/80 text-slate-400 border-slate-600'
        }`}
      >
        {inventory?.status_label}
      </span>

      {/* Image Thumbnail */}
      <div className="w-full h-36 sm:h-44 md:h-48 bg-slate-900/60 overflow-hidden flex items-center justify-center p-2.5 sm:p-3 relative">
        <img
          src={thumbnail_url || 'https://via.placeholder.com/400x300?text=TechShop'}
          alt={name}
          loading="lazy"
          className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 ease-out"
        />
      </div>

      {/* Product Content */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Brand & Category */}
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5">
            <span className="text-[10px] sm:text-[11px] font-bold text-sky-400 tracking-wider uppercase bg-sky-500/10 px-1.5 sm:px-2 py-0.5 rounded-md">
              {brand}
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-400 truncate">
              {getCategoryDisplayName(category?.name || category?.slug)}
            </span>
          </div>

          {/* Product Name */}
          <h3 className="text-xs sm:text-sm font-semibold line-clamp-2 text-slate-100 group-hover:text-sky-300 transition-colors title-clamp leading-snug min-h-[32px] sm:min-h-[36px]" title={name}>
            {name}
          </h3>
        </div>

        {/* Pricing & CTA */}
        <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-slate-700/60 flex items-end justify-between">
          <div>
            <p className="text-[9px] sm:text-[10px] text-slate-400">Giá từ</p>
            <div className="flex items-baseline gap-1 sm:gap-1.5 flex-wrap">
              <span className="text-sm sm:text-base font-extrabold text-sky-400 font-mono">
                {formatVND(pricing?.min_price)}
              </span>
              {pricing?.discount_percent > 0 && (
                <span className="text-[10px] sm:text-[11px] text-slate-400 line-through">
                  {formatVND(pricing?.base_price)}
                </span>
              )}
            </div>
          </div>

          {/* Action button */}
          <div
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-sky-500/15 group-hover:bg-sky-500 text-sky-400 group-hover:text-slate-950 flex items-center justify-center transition-all shadow-sm group-hover:scale-110 active:scale-90 cursor-pointer"
            title="Xem chi tiết"
          >
            ➔
          </div>
        </div>
      </div>
    </Link>
  );
}

export default ProductCard;
