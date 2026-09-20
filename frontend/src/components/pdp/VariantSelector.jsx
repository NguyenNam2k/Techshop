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

  return (
    <div className="space-y-3 p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
      <div className="flex items-center">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <span className="text-cyan-400">❖</span> Tùy chọn cấu hình / Phiên bản:
        </span>
      </div>

      <div className="flex flex-wrap gap-2.5">
        {variants.map((v) => {
          const isSelected = selectedVariant && selectedVariant.id === v.id;
          const isOutOfStock = Number(v.stock) <= 0;
          const diffText = formatDiff(v.price, basePrice);
          const optionLabel = v.spec_version || v.color || 'Bản tiêu chuẩn';

          return (
            <button
              key={v.id}
              disabled={isOutOfStock}
              onClick={() => !isOutOfStock && onVariantSelect(v)}
              title={isOutOfStock ? `Phiên bản ${optionLabel} hiện đã hết hàng` : ''}
              className={`group relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 border text-left
                ${isSelected 
                  ? 'bg-cyan-950/60 border-cyan-400 text-cyan-200 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/50 scale-[1.02]' 
                  : 'bg-slate-900/70 border-slate-700/80 text-slate-300 hover:border-slate-500 hover:text-white hover:bg-slate-800/70'}
                ${isOutOfStock ? 'opacity-40 cursor-not-allowed hover:bg-slate-900/70 hover:border-slate-700/80 hover:text-slate-300' : ''}
              `}
            >
              {}
              {(v.color_code || v.color) && (
                <span 
                  className="w-3.5 h-3.5 rounded-full border border-slate-600 shrink-0 shadow-sm"
                  style={{ backgroundColor: v.color_code || '#64748b' }}
                  title={v.color || 'Màu sắc'}
                />
              )}

              {}
              <span className="font-medium">{optionLabel}</span>

              {}
              {diffText && (
                <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md border
                  ${isSelected
                    ? 'text-cyan-300 bg-cyan-900/60 border-cyan-700/60'
                    : 'text-amber-300 bg-amber-950/60 border-amber-800/60'}
                `}>
                  {diffText}
                </span>
              )}

              {}
              {isOutOfStock && (
                <span className="text-[10px] text-rose-400 font-semibold uppercase bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-800/60">
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