import React from 'react';

const NO_VARIANT_SLUGS = new Set([
  'gpus',
  'cpus',
  'motherboards',
  'ram',
  'storage',
  'power-supplies',
  'cooling',
  'laptops',
  'monitors',
  'vga',
  'cpu',
  'mainboard',
  'psu',
  'ssd',
  'hdd',
  'laptop',
  'monitor',
  'linh-kien',
  'linh-kien-may-tinh',
  'linh-kien-pc'
]);

// Categories: 1..8 (PC components & Cases), 11 (Monitors), 12 (Laptops)
const NO_VARIANT_CATEGORY_IDS = new Set([1, 2, 3, 4, 5, 6, 7, 8, 11, 12]);

const NO_VARIANT_NAME_REGEX =
  /card|vga|gpu|cpu|vi xử lý|mainboard|bo mạch|motherboard|ram|bộ nhớ|ổ cứng|ssd|hdd|nguồn|psu|power|tản nhiệt|cooling|cooler|màn hình|monitor|laptop|zephyrus|legion|predator|tuf gaming|rog strix|vivobook|thinkpad|macbook|dell xps|alienware|linh kiện|rtx|gtx|rx \d|geforce|radeon|core i\d|core ultra|ryzen/i;

export function isSingleConfigurationProduct(props = {}) {
  if (!props || typeof props !== 'object') return false;
  const { categorySlug, categoryId, categoryName, name, product_name } = props;
  const cleanSlug = String(categorySlug || '').trim().toLowerCase();
  if (cleanSlug && NO_VARIANT_SLUGS.has(cleanSlug)) return true;
  if (categoryId && NO_VARIANT_CATEGORY_IDS.has(Number(categoryId))) return true;
  const cleanName = String(categoryName || '').trim();
  if (cleanName && NO_VARIANT_NAME_REGEX.test(cleanName)) return true;
  const prodName = String(name || product_name || '').trim();
  if (prodName && NO_VARIANT_NAME_REGEX.test(prodName)) return true;
  return false;
}

export const isPCComponentProduct = isSingleConfigurationProduct;

const VariantSelector = ({
  variants,
  selectedVariant,
  onVariantSelect,
  onVariantChange,
  categorySlug,
  categoryId,
  categoryName,
  productName
}) => {
  if (!variants || variants.length <= 1) {
    return null;
  }

  // Rule: Linh kiện máy tính (VGA, CPU, Mainboard, RAM, SSD/HDD, Nguồn, Tản nhiệt, Case),
  // Laptop và Màn hình mỗi mã là 1 cấu hình độc lập ngoài đời thực -> KHÔNG hiển thị tùy chọn cấu hình.
  // Chỉ hiển thị tùy chọn (màu sắc / switch / phụ kiện) cho Gaming Gears & Phụ kiện (Phím, Chuột, Tai nghe, Ghế, Lót chuột...).
  if (isSingleConfigurationProduct({ categorySlug, categoryId, categoryName, name: productName })) {
    return null;
  }

  const handleSelect = onVariantSelect || onVariantChange;

  const formatDiff = (variantPrice, basePrice) => {
    const diff = Number(variantPrice) - Number(basePrice);
    if (!diff || diff === 0) return null;
    const formatted = new Intl.NumberFormat('vi-VN').format(Math.abs(diff));
    return diff > 0 ? `+${formatted}₫` : `-${formatted}₫`;
  };

  const basePrice = variants[0]?.price || 0;
  const currentSelectedLabel =
    selectedVariant?.color || selectedVariant?.spec_version || selectedVariant?.sku || '';

  return (
    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-sm">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-200">
          Tùy chọn màu sắc / Phiên bản:{' '}
          <span className="text-sky-400 font-bold">{currentSelectedLabel}</span>
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {variants.map((v) => {
          const isSelected = selectedVariant?.id === v.id;
          const isOutOfStock = Number(v.stock) <= 0 || v.status === 'out_of_stock';
          const diffText = formatDiff(v.price, basePrice);
          const optionLabel = v.color
            ? v.spec_version && v.spec_version !== v.color
              ? `${v.color} — ${v.spec_version}`
              : v.color
            : v.spec_version || v.sku;

          return (
            <button
              key={v.id}
              type="button"
              onClick={() => handleSelect && handleSelect(v)}
              disabled={isOutOfStock}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer shadow-sm ${
                isSelected
                  ? 'border-sky-500 bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'border-slate-700 bg-slate-800 text-slate-200 hover:border-slate-500 hover:bg-slate-700'
              } ${
                isOutOfStock
                  ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500 border-slate-800'
                  : ''
              }`}
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
                <span
                  className={`text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded-md ${
                    isSelected
                      ? 'bg-sky-700 text-white'
                      : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                  }`}
                >
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