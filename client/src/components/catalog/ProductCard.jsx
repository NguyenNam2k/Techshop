function formatVND(amount) {
  if (!amount && amount !== 0) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function ProductCard({ product }) {
  const {
    name,
    brand,
    thumbnail_url,
    pricing,
    inventory,
    category
  } = product;

  return (
    <div className="group bg-slate-800 rounded-2xl border border-slate-700/80 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 flex flex-col overflow-hidden relative">
      {/* Discount Badge */}
      {pricing?.discount_percent > 0 && (
        <span className="absolute top-3 left-3 z-10 bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-md">
          -{pricing.discount_percent}%
        </span>
      )}

      {/* Stock Status Badge */}
      <span
        className={`absolute top-3 right-3 z-10 text-[10px] font-semibold px-2 py-0.5 rounded-full border backdrop-blur-md ${
          inventory?.in_stock
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            : 'bg-slate-700/80 text-slate-400 border-slate-600'
        }`}
      >
        {inventory?.status_label}
      </span>

      {/* Image Thumbnail */}
      <div className="w-full h-48 bg-slate-900/60 overflow-hidden flex items-center justify-center p-3 relative">
        <img
          src={thumbnail_url || 'https://via.placeholder.com/400x300?text=TechShop'}
          alt={name}
          loading="lazy"
          className="w-full h-full object-contain group-hover:scale-108 transition-transform duration-500 ease-out"
        />
      </div>

      {/* Product Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Brand & Category */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold text-blue-400 tracking-wider uppercase bg-blue-500/10 px-2 py-0.5 rounded-md">
              {brand}
            </span>
            <span className="text-[11px] text-slate-400 truncate">
              {category?.name}
            </span>
          </div>

          {/* Product Name */}
          <h3 className="text-white text-sm font-semibold line-clamp-2 group-hover:text-blue-300 transition-colors title-clamp leading-snug" title={name}>
            {name}
          </h3>
        </div>

        {/* Pricing & CTA */}
        <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-end justify-between">
          <div>
            <p className="text-[10px] text-slate-400">Giá từ</p>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-base font-extrabold text-blue-400 font-mono">
                {formatVND(pricing?.min_price)}
              </span>
              {pricing?.discount_percent > 0 && (
                <span className="text-[11px] text-slate-400 line-through">
                  {formatVND(pricing?.base_price)}
                </span>
              )}
            </div>
          </div>

          {/* Action button */}
          <button
            type="button"
            className="w-9 h-9 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-sm group-hover:scale-105"
            title="Xem chi tiết"
          >
            ➔
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
