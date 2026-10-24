import React from 'react';
import {
  Edit3,
  PackagePlus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Check,
  Laptop,
  Plus,
  Images
} from 'lucide-react';

function ProductTable({
  products = [],
  pagination = {},
  loading = false,
  onPageChange,
  onEdit,
  onQuickStock,
  onDelete,
  onOpenCreate,
  onOpenGallery
}) {
  const {
    page = 1,
    totalPages = 1,
    total = 0,
    hasPrev = false,
    hasNext = false,
    startIndex = 1,
    endIndex = 0
  } = pagination;

  // Generate pagination numbers
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl flex flex-col">
      {/* Table Title Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Danh Sách Thiết Bị Công Nghệ</span>
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              {total} thiết bị
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Quản lý thông tin, phân loại danh mục và đồng bộ kho hàng trực tiếp
          </p>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto min-h-[300px] relative">
        {loading ? (
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-2.5">
              <div className="w-9 h-9 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-300 font-medium">Đang tải danh sách thiết bị...</p>
            </div>
          </div>
        ) : null}

        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
              <th className="py-3 px-4 w-12 text-center">#ID</th>
              <th className="py-3 px-4 min-w-[280px]">Thiết Bị / Model / SKU</th>
              <th className="py-3 px-4 min-w-[110px]">Thương Hiệu</th>
              <th className="py-3 px-4 min-w-[130px]">Danh Mục</th>
              <th className="py-3 px-4 text-right min-w-[120px]">Giá Niêm Yết</th>
              <th className="py-3 px-4 text-center min-w-[120px]">Tồn Kho</th>
              <th className="py-3 px-4 text-center min-w-[100px]">Trạng Thái</th>
              <th className="py-3 px-4 text-right min-w-[130px]">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {products.length === 0 && !loading ? (
              <tr>
                <td colSpan="8" className="py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-3 max-w-sm mx-auto">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-500">
                      <Laptop className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-200">Không tìm thấy thiết bị nào</p>
                    <p className="text-xs text-slate-500 text-center">
                      Thử thay đổi từ khóa tìm kiếm hoặc bấm Thêm Mới Thiết Bị để khởi tạo sản phẩm vào kho.
                    </p>
                    <button
                      type="button"
                      onClick={onOpenCreate}
                      className="mt-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Thêm Thiết Bị Mới</span>
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              products.map((prod) => {
                const stock = prod.total_stock ?? 0;
                const isOutOfStock = stock <= 0;
                const isLowStock = stock > 0 && stock <= 5;
                const priceFormatted = Number(prod.base_price || 0).toLocaleString('vi-VN');

                return (
                  <tr
                    key={prod.id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* ID */}
                    <td className="py-3.5 px-4 text-center font-mono text-slate-500 group-hover:text-cyan-400 transition-colors">
                      #{prod.id}
                    </td>

                    {/* Product Name & SKU */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {/* Thumbnail */}
                        <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700/80 overflow-hidden shrink-0 flex items-center justify-center group-hover:border-cyan-500/40 transition-colors">
                          {prod.thumbnail_url || prod.thumbnail || prod.image_url ? (
                            <img
                              src={prod.thumbnail_url || prod.thumbnail || prod.image_url}
                              alt={prod.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-full h-full flex items-center justify-center text-slate-500 ${
                              prod.thumbnail_url || prod.thumbnail || prod.image_url ? 'hidden' : ''
                            }`}
                          >
                            <Laptop className="w-5 h-5 text-slate-400" />
                          </div>
                        </div>

                        {/* Name & SKU Badge */}
                        <div className="min-w-0 flex-1">
                          <h3
                            className="font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors truncate max-w-[280px]"
                            title={prod.name}
                          >
                            {prod.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700/60 font-medium">
                              {prod.sku_code || 'N/A'}
                            </span>
                            {prod.model_code && prod.model_code !== prod.sku_code && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                {prod.model_code}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Brand */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700/60 font-medium">
                        {prod.brand || 'Khác'}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700/60 font-medium">
                        {prod.category_name || 'Uncategorized'}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono font-bold text-slate-100">
                      {priceFormatted} ₫
                    </td>

                    {/* Stock Status Badge */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {isOutOfStock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                          <AlertCircle className="w-3 h-3" />
                          <span>Hết hàng (0)</span>
                        </span>
                      ) : isLowStock ? (
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
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                          {prod.status}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {/* Gallery Button */}
                        {onOpenGallery && (
                          <button
                            type="button"
                            onClick={() => onOpenGallery(prod)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 border border-slate-700/60 hover:border-emerald-500/40 transition-all cursor-pointer"
                            title="Bộ sưu tập ảnh Cloud"
                          >
                            <Images className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => onEdit(prod)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-400 border border-slate-700/60 hover:border-cyan-500/40 transition-all cursor-pointer"
                          title="Chỉnh sửa thiết bị"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Quick Stock Adjust Button */}
                        <button
                          type="button"
                          onClick={() => onQuickStock(prod)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-violet-500/20 text-slate-300 hover:text-violet-400 border border-slate-700/60 hover:border-violet-500/40 transition-all cursor-pointer"
                          title="Điều chỉnh kho nhanh"
                        >
                          <PackagePlus className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => onDelete(prod)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700/60 hover:border-rose-500/40 transition-all cursor-pointer"
                          title="Xóa thiết bị"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="text-slate-400">
          Hiển thị{' '}
          <span className="font-semibold text-slate-200">{startIndex}</span> -{' '}
          <span className="font-semibold text-slate-200">{endIndex}</span> trên tổng số{' '}
          <span className="font-semibold text-cyan-400">{total}</span> thiết bị
        </div>

        <div className="flex items-center gap-1.5">
          {/* Previous Button */}
          <button
            type="button"
            disabled={!hasPrev || loading}
            onClick={() => onPageChange(page - 1)}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 border transition-all ${
              hasPrev && !loading
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 cursor-pointer'
                : 'bg-slate-900 text-slate-600 border-slate-800/80 cursor-not-allowed'
            }`}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Prev</span>
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {getPageNumbers().map((pNum) => (
              <button
                key={pNum}
                type="button"
                disabled={loading}
                onClick={() => onPageChange(pNum)}
                className={`w-7 h-7 rounded-lg text-xs font-mono font-semibold transition-all ${
                  pNum === page
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 cursor-pointer'
                }`}
              >
                {pNum}
              </button>
            ))}
          </div>

          {/* Next Button */}
          <button
            type="button"
            disabled={!hasNext || loading}
            onClick={() => onPageChange(page + 1)}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 border transition-all ${
              hasNext && !loading
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 cursor-pointer'
                : 'bg-slate-900 text-slate-600 border-slate-800/80 cursor-not-allowed'
            }`}
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductTable;
