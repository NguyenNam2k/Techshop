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

  if (isHardware) {
    return null;
  }

  const formatDiff = (variantPrice, basePrice) => {
    const diff = variantPrice - basePrice;
    if (diff === 0) return null;
    const formatted = new Intl.NumberFormat('vi-VN').format(Math.abs(diff));
    return diff > 0 ? `+${formatted}₫` : `-${formatted}₫`;
  };

  const basePrice = variants[0]?.price || 0;
  const currentSelectedLabel = selectedVariant?.color || selectedVariant?.spec_version || selectedVariant?.sku || '';

  return (
    <div className="p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 space-y-3 transition-colors">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
          Tùy chọn cấu hình / Màu sắc: <span className="text-sky-600 dark:text-sky-400 font-normal">{currentSelectedLabel}</span>
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {variants.map((v) => {
          const isSelected = selectedVariant?.id === v.id;
          const isOutOfStock = v.stock === 0;
          const diffText = formatDiff(v.price, basePrice);
          const optionLabel = v.color || v.spec_version || v.sku;

          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onVariantSelect(v)}
              disabled={isOutOfStock}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                isSelected
                  ? 'border-sky-600 bg-sky-600 text-white shadow-md'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-sky-400 dark:hover:border-sky-500'
              } ${isOutOfStock ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700' : ''}`}
            >
              {(v.color_code || v.color) && (
                <span 
                  className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600 shrink-0 shadow-sm"
                  style={{ backgroundColor: v.color_code || '#94a3b8' }}
                  title={v.color || 'Màu sắc'}
                />
              )}

              <span>{optionLabel}</span>

              {diffText && (
                <span className={`text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded-md ${
                  isSelected
                    ? 'bg-sky-700/80 text-white'
                    : 'bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300'
                }`}>
                  {diffText}
                </span>
              )}

              {isOutOfStock && (
                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold uppercase bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-800">
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