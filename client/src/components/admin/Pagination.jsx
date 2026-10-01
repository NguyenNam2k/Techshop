import React from 'react';

function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange
}) {
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Tạo danh sách các số trang cần hiển thị (tối đa 5 nút số)
  const pages = [];
  const maxButtons = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);

  if (endPage - startPage + 1 < maxButtons) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-slate-800/80 border-t border-slate-700 text-sm text-slate-400">
      {/* Thông tin số lượng hiển thị */}
      <div className="flex items-center gap-4">
        <span>
          Hiển thị <strong className="text-white">{startItem}</strong> - <strong className="text-white">{endItem}</strong> trên <strong className="text-white">{totalItems}</strong> kết quả
        </span>
        {onItemsPerPageChange && (
          <div className="flex items-center gap-2">
            <span className="text-xs">Số lượng/trang:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="bg-slate-700 text-white border border-slate-600 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        )}
      </div>

      {/* Điều hướng trang */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs transition"
          title="Trang đầu"
        >
          ««
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs transition"
          title="Trang trước"
        >
          ‹
        </button>

        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              currentPage === page
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs transition"
          title="Trang sau"
        >
          ›
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs transition"
          title="Trang cuối"
        >
          »»
        </button>
      </div>
    </div>
  );
}

export default Pagination;
