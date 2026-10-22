import React from 'react';
import {
  Cpu,
  Search,
  Filter,
  PlusCircle,
  Inbox,
  HardDrive,
  Image as ImageIcon,
  Tag,
  XCircle,
  AlertCircle,
  Check,
  Images,
  Edit3,
  PackagePlus,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function ProductTable({
  products = [],
  categories = [],
  pagination = {},
  filters = {},
  onFilterChange,
  onNavigateCreateProduct,
  onOpenImageViewer,
  onOpenGalleryModal,
  onEditProduct,
  onQuickAdjustStock,
  onDeleteProduct
}) {
  const curPage = pagination.page || 1;
  const totalPages = pagination.totalPages || 1;
  const total = pagination.total || 0;
  const startIndex = pagination.startIndex || 1;
  const endIndex = pagination.endIndex || products.length;

  // Compute page numbers around current
  const pageNumbers = [];
  let startP = Math.max(1, curPage - 2);
  let endP = Math.min(totalPages, curPage + 2);
  if (endP - startP < 4) {
    if (startP === 1) endP = Math.min(totalPages, startP + 4);
    else if (endP === totalPages) startP = Math.max(1, endP - 4);
  }
  for (let i = startP; i <= endP; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-slate-800">
      {/* Table Header & Controls Bar */}
      <div className="p-5 border-b border-slate-800/80 bg-slate-900/40 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <span>Danh Sách Thiết Bị Công Nghệ</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Quản trị danh mục, tồn kho và theo dõi giá niêm yết
            </p>
          </div>

          {/* Quick Stats & Add Button */}
          <div className="flex items-center gap-3">
            {onNavigateCreateProduct && (
              <button
                type="button"
                onClick={onNavigateCreateProduct}
                className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Thêm Thiết Bị Mới</span>
              </button>
            )}

            <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
              Trang <span className="text-cyan-400 font-bold">{curPage}</span> / {totalPages} (Tổng {total} mục)
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
          {/* Search bar */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
              placeholder="Tìm theo tên, hãng (Asus, Apple...), SKU..."
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-800/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
            />
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-3">
            <select
              value={filters.category_id || 'all'}
              onChange={(e) => onFilterChange({ category_id: e.target.value, page: 1 })}
              className="w-full px-3 py-2 text-xs bg-slate-800/80 border border-slate-700/80 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 transition-all cursor-pointer"
            >
              <option value="all">Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.product_count ?? 0})
                </option>
              ))}
            </select>
          </div>

          {/* Stock Filter */}
          <div className="sm:col-span-2">
            <select
              value={filters.stock_status || 'all'}
              onChange={(e) => onFilterChange({ stock_status: e.target.value, page: 1 })}
              className="w-full px-3 py-2 text-xs bg-slate-800/80 border border-slate-700/80 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 transition-all cursor-pointer"
            >
              <option value="all">Tất cả tồn kho</option>
              <option value="in_stock">Còn hàng (&gt;0)</option>
              <option value="low_stock">Sắp hết (≤5)</option>
              <option value="out_of_stock">Hết hàng (=0)</option>
            </select>
          </div>

          {/* Limit selector */}
          <div className="sm:col-span-2 flex gap-2">
            <select
              value={filters.limit || 10}
              onChange={(e) => onFilterChange({ limit: Number(e.target.value), page: 1 })}
              className="w-full px-3 py-2 text-xs bg-slate-800/80 border border-slate-700/80 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 transition-all cursor-pointer"
            >
              <option value="5">5 / trang</option>
              <option value="10">10 / trang</option>
              <option value="20">20 / trang</option>
              <option value="50">50 / trang</option>
            </select>
            <button
              type="button"
              onClick={() => onFilterChange({})}
              className="p-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 rounded-xl transition-all"
              title="Lọc / Làm mới"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold tracking-wider uppercase text-[11px]">
              <th className="py-3 px-4">SKU / Thiết Bị</th>
              <th className="py-3 px-4">Danh Mục</th>
              <th className="py-3 px-4">Giá Cơ Sở</th>
              <th className="py-3 px-4 text-center">Tồn Kho</th>
              <th className="py-3 px-4 text-center">Trạng Thái</th>
              <th className="py-3 px-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {products.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                      <Inbox className="w-6 h-6" />
                    </div>
                    <p className="font-medium">Không tìm thấy thiết bị nào phù hợp với bộ lọc.</p>
                    <button
                      type="button"
                      onClick={() => onFilterChange({ search: '', category_id: 'all', stock_status: 'all', page: 1 })}
                      className="text-xs text-cyan-400 hover:underline"
                    >
                      Xóa bộ lọc để xem tất cả
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              products.map((prod) => {
                const stock = Number(prod.total_stock ?? 0);
                return (
                  <tr key={prod.id} className="hover:bg-slate-800/40 transition-colors group">
                    {/* SKU & Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {/* Interactive Product Image Thumbnail */}
                        <div
                          className="relative w-12 h-12 rounded-xl bg-slate-800 border border-slate-700/80 overflow-hidden shrink-0 group-hover:border-cyan-400/60 shadow-md transition-all cursor-pointer"
                          onClick={() => onOpenImageViewer(prod.thumbnail_url, prod.name)}
                          title="Nhấn để xem ảnh lớn"
                        >
                          {prod.thumbnail_url ? (
                            <img
                              src={prod.thumbnail_url}
                              alt={prod.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              loading="lazy"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) e.target.nextSibling.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div
                            className={`${
                              prod.thumbnail_url ? 'hidden' : ''
                            } w-full h-full flex items-center justify-center bg-slate-800 text-slate-500 group-hover:text-cyan-400 transition-colors`}
                          >
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className="font-semibold text-slate-100 truncate max-w-[220px]"
                              title={prod.name}
                            >
                              {prod.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-[11px] text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                              {prod.sku_code || 'N/A'}
                            </span>
                            <span className="text-[11px] text-slate-400">• {prod.brand}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-800/90 text-slate-200 border border-slate-700/60">
                        <Tag className="w-3 h-3 text-cyan-400" />
                        <span>{prod.category_name || 'Uncategorized'}</span>
                      </span>
                    </td>

                    {/* Base Price */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono text-sm font-semibold text-slate-100">
                        {Number(prod.base_price ?? 0).toLocaleString('vi-VN')} ₫
                      </span>
                    </td>

                    {/* Stock Badge */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {stock === 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                          <XCircle className="w-3 h-3" />
                          <span>Hết hàng (0)</span>
                        </span>
                      ) : stock <= 5 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          <AlertCircle className="w-3 h-3" />
                          <span>Sắp hết ({stock})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          <Check className="w-3 h-3" />
                          <span>Còn {stock} cái</span>
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {prod.status === 'active' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-950 text-emerald-300 border border-emerald-800/50">
                          Active
                        </span>
                      ) : prod.status === 'out_of_stock' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-rose-950 text-rose-300 border border-rose-800/50">
                          Hết hàng
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300">
                          {prod.status}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Gallery Modal Button */}
                        <button
                          type="button"
                          onClick={() => onOpenGalleryModal(prod.id, prod.name)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 border border-slate-700/60 hover:border-emerald-500/40 transition-all"
                          title="Bộ sưu tập ảnh thiết bị"
                        >
                          <Images className="w-4 h-4" />
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => onEditProduct(prod)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-400 border border-slate-700/60 hover:border-cyan-500/40 transition-all"
                          title="Chỉnh sửa thiết bị"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Quick Stock Adjust Button */}
                        <button
                          type="button"
                          onClick={() =>
                            onQuickAdjustStock({
                              variant_id: prod.default_variant_id || prod.id,
                              sku_code: prod.sku_code,
                              total_stock: prod.total_stock,
                              name: prod.name
                            })
                          }
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-violet-500/20 text-slate-300 hover:text-violet-400 border border-slate-700/60 hover:border-violet-500/40 transition-all"
                          title="Điều chỉnh kho nhanh"
                        >
                          <PackagePlus className="w-4 h-4" />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => onDeleteProduct(prod)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700/60 hover:border-rose-500/40 transition-all"
                          title="Xóa thiết bị"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION CONTROLS */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="text-slate-400">
          Hiển thị <span className="font-semibold text-slate-200">{startIndex}</span> -{' '}
          <span className="font-semibold text-slate-200">{endIndex}</span> trên tổng số{' '}
          <span className="font-semibold text-cyan-400">{total}</span> thiết bị
        </div>

        <div className="flex items-center gap-1.5">
          {/* Previous Button */}
          {pagination.hasPrev ? (
            <button
              type="button"
              onClick={() => onFilterChange({ page: curPage - 1 })}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center gap-1 border border-slate-700 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Prev</span>
            </button>
          ) : (
            <button
              disabled
              className="px-3 py-1.5 rounded-lg bg-slate-900 text-slate-600 font-medium flex items-center gap-1 border border-slate-800/80 cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Prev</span>
            </button>
          )}

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {pageNumbers.map((p) =>
              p === curPage ? (
                <span
                  key={p}
                  className="w-8 h-8 rounded-lg bg-cyan-500 text-slate-950 font-bold flex items-center justify-center font-mono"
                >
                  {p}
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => onFilterChange({ page: p })}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium flex items-center justify-center font-mono border border-slate-700 transition-all"
                >
                  {p}
                </button>
              )
            )}
          </div>

          {/* Next Button */}
          {pagination.hasNext ? (
            <button
              type="button"
              onClick={() => onFilterChange({ page: curPage + 1 })}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center gap-1 border border-slate-700 transition-all"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              disabled
              className="px-3 py-1.5 rounded-lg bg-slate-900 text-slate-600 font-medium flex items-center gap-1 border border-slate-800/80 cursor-not-allowed"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
