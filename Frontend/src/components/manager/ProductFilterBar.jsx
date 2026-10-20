import React from 'react';
import {
  Search,
  Filter,
  Plus,
  Boxes,
  FolderTree,
  RotateCcw,
  ClipboardList,
  SlidersHorizontal,
  X
} from 'lucide-react';

function ProductFilterBar({
  filters,
  onFilterChange,
  categories = [],
  onOpenCreate,
  onOpenBatchStock,
  onOpenCategories,
  onOpenLogs,
  onResetFilters
}) {
  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
      {/* Top row: Search and Actions */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            placeholder="Tìm theo tên thiết bị, model, thương hiệu, SKU..."
            className="w-full pl-10 pr-9 py-2.5 text-xs bg-slate-800/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onFilterChange('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            type="button"
            onClick={onOpenCreate}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-950 group-hover:rotate-90 transition-transform" />
            <span>Thêm Thiết Bị</span>
          </button>

          <button
            type="button"
            onClick={onOpenBatchStock}
            className="flex-1 sm:flex-none px-3.5 py-2.5 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 hover:text-violet-200 border border-violet-500/30 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Boxes className="w-4 h-4 text-violet-400" />
            <span>Điều Chỉnh Kho</span>
          </button>

          <button
            type="button"
            onClick={onOpenCategories}
            className="flex-1 sm:flex-none px-3.5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <FolderTree className="w-4 h-4 text-emerald-400" />
            <span>Danh Mục</span>
          </button>

          <button
            type="button"
            onClick={onOpenLogs}
            className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            title="Xem nhật ký kho"
          >
            <ClipboardList className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Nhật Ký</span>
          </button>
        </div>
      </div>

      {/* Bottom row: Filter Selectors */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold text-slate-300">Bộ lọc chi tiết:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 flex-1 max-w-2xl">
          {/* Category Filter */}
          <select
            value={filters.category_id}
            onChange={(e) => onFilterChange('category_id', e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            <option value="all">Tất cả danh mục phần cứng</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name} ({cat.product_count ?? 0})
              </option>
            ))}
          </select>

          {/* Stock Status Filter */}
          <select
            value={filters.stock_status}
            onChange={(e) => onFilterChange('stock_status', e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            <option value="all">Tất cả trạng thái tồn kho</option>
            <option value="in_stock">🟢 Còn hàng (&gt; 5 cái)</option>
            <option value="low_stock">🟡 Sắp hết hàng (&le; 5 cái)</option>
            <option value="out_of_stock">🔴 Hết hàng (0 cái)</option>
          </select>

          {/* Sort Filter */}
          <select
            value={filters.sort}
            onChange={(e) => onFilterChange('sort', e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            <option value="newest">Mới nhất trước</option>
            <option value="oldest">Cũ nhất trước</option>
            <option value="price_asc">Giá tăng dần (Thấp &rarr; Cao)</option>
            <option value="price_desc">Giá giảm dần (Cao &rarr; Thấp)</option>
            <option value="stock_asc">Tồn kho tăng dần</option>
            <option value="stock_desc">Tồn kho giảm dần</option>
          </select>
        </div>

        {/* Reset button */}
        {(filters.search || filters.category_id !== 'all' || filters.stock_status !== 'all' || filters.sort !== 'newest') && (
          <button
            type="button"
            onClick={onResetFilters}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all flex items-center justify-center gap-1.5 self-end sm:self-center cursor-pointer shrink-0"
            title="Đặt lại bộ lọc"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Đặt lại</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default ProductFilterBar;
