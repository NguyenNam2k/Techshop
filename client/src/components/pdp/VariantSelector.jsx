import React from 'react';

const VariantSelector = ({ variants, selectedVariant, onVariantSelect, categorySlug, categoryName }) => {
  if (!variants || variants.length <= 1) {
    return null;
  }
  const slug = (categorySlug || '').toLowerCase();
  const name = (categoryName || '').toLowerCase();

  const isHardware = 
    ['gpus', 'cpus', 'motherboards', 'ram', 'storage', 'power-supplies', 'cooling', 'monitors', 'laptops'].includes(slug) ||
    /card|vga|gpu|cpu|vi xử lý|mainboard|bo mạch|ram|bộ nhớ|ổ cứng|ssd|hdd|nguồn|psu|power|tản nhiệt|cooling|cooler|màn hình|laptop/i.test(name);

  // Vẫn hiển thị nếu có biến thể khác màu sắc hoặc cấu hình
  const formatDiff = (variantPrice, basePrice) => {
    const diff = variantPrice - basePrice;
    if (diff === 0) return null;
    const formatted = new Intl.NumberFormat('vi-VN').format(Math.abs(diff));
    return diff > 0 ? `+${formatted}₫` : `-${formatted}₫`;
  };

  const basePrice = variants[0]?.price || 0;
  const currentSelectedLabel = selectedVariant?.color || selectedVariant?.spec_version || selectedVariant?.sku || '';

  return (
    <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-200">
          Tùy chọn cấu hình / Phiên bản: <span className="text-sky-400 font-semibold">{currentSelectedLabel}</span>
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {variants.map((v) => {
          const isSelected = selectedVariant?.id === v.id;
          const isOutOfStock = v.stock === 0;
          const diffText = formatDiff(v.price, basePrice);
          const optionLabel = v.spec_version || v.color || v.sku;

          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onVariantSelect(v)}
              disabled={isOutOfStock}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                isSelected
                  ? 'border-sky-500 bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'border-slate-700 bg-slate-800 text-slate-200 hover:border-slate-500 hover:bg-slate-700'
              } ${isOutOfStock ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500 border-slate-800' : ''}`}
            >
              {(v.color_code || v.color) && (
                <span 
                  className="w-3.5 h-3.5 rounded-full border border-slate-600 shrink-0 shadow-sm"
                  style={{ backgroundColor: v.color_code || '#94a3b8' }}
                  title={v.color || 'Màu sắc'}
                />
              )}

              <span>{optionLabel}</span>

              {diffText && (
                <span className={`text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded-md ${
                  isSelected
                    ? 'bg-sky-700 text-white'
                    : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                }`}>
                  {diffText}
                </span>
              )}

              {isOutOfStock && (
                <span className="text-[10px] text-rose-400 font-semibold uppercase bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/30">
                  Hết hàng
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default VariantSelector;
