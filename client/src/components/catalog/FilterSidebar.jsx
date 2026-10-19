import { useState, useEffect } from 'react';

function FilterSidebar({
  metadata,
  filters,
  onFilterChange,
  onResetFilters,
  onCloseMobile
}) {
  const [brandSearch, setBrandSearch] = useState('');
  const [localMinPrice, setLocalMinPrice] = useState(filters.minPrice || '');
  const [localMaxPrice, setLocalMaxPrice] = useState(filters.maxPrice || '');

  // Đồng bộ khi URL filters thay đổi từ bên ngoài (ví dụ reset toàn bộ)
  useEffect(() => {
    setLocalMinPrice(filters.minPrice || '');
  }, [filters.minPrice]);

  useEffect(() => {
    setLocalMaxPrice(filters.maxPrice || '');
  }, [filters.maxPrice]);

  // Áp dụng khoảng giá khi bấm nút hoặc ấn Enter
  const handleApplyPrice = (e) => {
    if (e) e.preventDefault();
    onFilterChange({
      minPrice: localMinPrice ? String(localMinPrice).trim() : '',
      maxPrice: localMaxPrice ? String(localMaxPrice).trim() : ''
    });
  };

  // Xóa riêng khoảng giá
  const handleClearPrice = () => {
    setLocalMinPrice('');
    setLocalMaxPrice('');
    onFilterChange({ minPrice: '', maxPrice: '' });
  };

  const { categories = [], brands = [], priceRange = { min: 0, max: 100000000 } } = metadata || {};

  // Xử lý chọn/bỏ chọn Brand
  const handleBrandToggle = (brand) => {
    const currentBrands = filters.brands ? filters.brands.split(',').filter(Boolean) : [];
    let updated;
    if (currentBrands.includes(brand)) {
      updated = currentBrands.filter((b) => b !== brand);
    } else {
      updated = [...currentBrands, brand];
    }
    onFilterChange('brands', updated.join(','));
  };

  // Lọc thương hiệu theo ô tìm kiếm nhỏ
  const filteredBrands = brands.filter((b) =>
    b.toLowerCase().includes(brandSearch.toLowerCase().trim())
  );

  const selectedBrandsList = filters.brands ? filters.brands.split(',').filter(Boolean) : [];

  return (
    <aside className="w-full bg-slate-800 rounded-2xl border border-slate-700/80 p-5 text-white flex flex-col gap-6 shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-700/80">
        <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-slate-200">
          <span>⚙️</span> Bộ Lọc Sản Phẩm
        </h2>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden text-slate-400 hover:text-white text-base font-bold"
          >
            ✕
          </button>
        )}
      </div>

      {/* 1. Lọc theo Danh Mục */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
          <span>Danh Mục</span>
          {filters.category && (
            <button
              onClick={() => onFilterChange('category', '')}
              className="text-[11px] text-blue-400 hover:text-blue-300 font-normal lowercase"
            >
              xóa
            </button>
          )}
        </h3>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 text-sm">
          <button
            type="button"
            onClick={() => onFilterChange('category', '')}
            className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center justify-between ${
              !filters.category
                ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30'
                : 'text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            <span>Tất cả danh mục</span>
          </button>
          {categories.map((cat) => {
            const isSelected = filters.category === cat.slug || filters.category === String(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onFilterChange('category', cat.slug)}
                className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center justify-between ${
                  isSelected
                    ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30'
                    : 'text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                <span className="truncate flex items-center gap-1.5">
                  <span>{cat.icon_url || '📁'}</span> {cat.name}
                </span>
                <span className="text-[10px] text-slate-400 bg-slate-900/60 px-1.5 py-0.5 rounded-full">
                  {cat.product_count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Lọc theo Thương Hiệu (Brands) */}
      <div className="pt-4 border-t border-slate-700/60">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Thương Hiệu</h3>
          {selectedBrandsList.length > 0 && (
            <button
              onClick={() => onFilterChange('brands', '')}
              className="text-[11px] text-blue-400 hover:text-blue-300"
            >
              xóa ({selectedBrandsList.length})
            </button>
          )}
        </div>

        {/* Brand search input nếu nhiều brands */}
        {brands.length > 5 && (
          <input
            type="text"
            value={brandSearch}
            onChange={(e) => setBrandSearch(e.target.value)}
            placeholder="Tìm thương hiệu..."
            className="w-full bg-slate-900 text-xs text-white placeholder-slate-400 rounded-lg px-2.5 py-1.5 mb-2.5 border border-slate-700 outline-none focus:border-blue-500"
          />
        )}

        <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
          {filteredBrands.map((brand) => {
            const checked = selectedBrandsList.includes(brand);
            return (
              <label
                key={brand}
                className="flex items-center gap-2.5 px-2 py-1 rounded-lg hover:bg-slate-700/40 text-xs cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => handleBrandToggle(brand)}
                  className="rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 accent-blue-600"
                />
                <span className={checked ? 'text-blue-300 font-semibold' : 'text-slate-300'}>
                  {brand}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 3. Lọc theo Khoảng Giá (Min / Max Price) */}
      <div className="pt-4 border-t border-slate-700/60">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Khoảng Giá (VNĐ)
          </h3>
          {(filters.minPrice || filters.maxPrice) && (
            <button
              type="button"
              onClick={handleClearPrice}
              className="text-[11px] text-blue-400 hover:text-blue-300 font-normal lowercase"
            >
              xóa giá
            </button>
          )}
        </div>

        <form onSubmit={handleApplyPrice} className="space-y-2 mb-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Từ</label>
              <input
                type="text"
                inputMode="numeric"
                value={localMinPrice}
                onChange={(e) => setLocalMinPrice(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => { if (e.key === 'Enter') handleApplyPrice(e); }}
                placeholder="0"
                className="w-full bg-slate-900 text-white text-xs rounded-lg px-2.5 py-1.5 border border-slate-700 focus:border-blue-500 outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Đến</label>
              <input
                type="text"
                inputMode="numeric"
                value={localMaxPrice}
                onChange={(e) => setLocalMaxPrice(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => { if (e.key === 'Enter') handleApplyPrice(e); }}
                placeholder="Tối đa"
                className="w-full bg-slate-900 text-white text-xs rounded-lg px-2.5 py-1.5 border border-slate-700 focus:border-blue-500 outline-none font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white rounded-lg text-xs font-semibold transition shadow-sm cursor-pointer"
          >
            Áp dụng khoảng giá
          </button>
        </form>

        {/* Quick price presets */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: '< 5 triệu', min: '', max: '5000000' },
            { label: '5 - 15 triệu', min: '5000000', max: '15000000' },
            { label: '15 - 30 triệu', min: '15000000', max: '30000000' },
            { label: '> 30 triệu', min: '30000000', max: '' }
          ].map((preset) => {
            const isSelected = filters.minPrice === preset.min && filters.maxPrice === preset.max;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setLocalMinPrice(preset.min);
                  setLocalMaxPrice(preset.max);
                  onFilterChange({
                    minPrice: preset.min,
                    maxPrice: preset.max
                  });
                }}
                className={`text-[10px] px-2 py-1 rounded-md transition cursor-pointer border ${
                  isSelected
                    ? 'bg-blue-600/30 text-blue-300 border-blue-500/50 font-semibold'
                    : 'bg-slate-900/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Tình Trạng Hàng (In-Stock Only) */}
      <div className="pt-4 border-t border-slate-700/60">
        <label className="flex items-center justify-between cursor-pointer select-none">
          <span className="text-xs text-slate-300 font-medium">Chỉ sản phẩm còn hàng</span>
          <input
            type="checkbox"
            checked={filters.inStock === 'true' || filters.inStock === true}
            onChange={(e) => onFilterChange('inStock', e.target.checked ? 'true' : '')}
            className="w-4 h-4 rounded border-slate-600 bg-slate-900 accent-blue-600 cursor-pointer"
          />
        </label>
      </div>

      {/* 5. Nút Reset Bộ Lọc */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onResetFilters}
          className="w-full py-2 bg-slate-700/50 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/30 text-slate-400 border border-slate-700 rounded-xl text-xs font-semibold transition"
        >
          🔄 Xóa tất cả bộ lọc
        </button>
      </div>
    </aside>
  );
}

export default FilterSidebar;
