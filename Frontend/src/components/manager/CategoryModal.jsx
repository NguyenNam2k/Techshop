import React, { useState } from 'react';
import { FolderTree, X, Plus, Trash2, AlertCircle } from 'lucide-react';

function CategoryModal({
  isOpen,
  onClose,
  categories = [],
  onCreateCategory,
  onDeleteCategory,
  loading = false
}) {
  const [newCatName, setNewCatName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleCreate = (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!newCatName.trim()) {
      setErrorMsg('Tên danh mục không được để trống.');
      return;
    }
    onCreateCategory(newCatName.trim());
    setNewCatName('');
  };

  const handleDelete = (cat) => {
    const confirmText =
      `Bạn có chắc chắn muốn xóa danh mục "${cat.name}" (ID: ${cat.id})?\n\n` +
      `• Toàn bộ ${cat.product_count ?? 0} thiết bị trong danh mục này sẽ được tự động chuyển giao an toàn sang danh mục mặc định "Uncategorized" (ID: 1).\n` +
      `• Sau đó danh mục "${cat.name}" mới được xóa.`;

    if (window.confirm(confirmText)) {
      onDeleteCategory(cat.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Quản Lý Danh Mục Phần Cứng</h3>
              <p className="text-xs text-slate-400">
                Thêm danh mục mới và chuyển giao thiết bị an toàn khi xóa danh mục
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Add Category Input Form */}
          <form
            onSubmit={handleCreate}
            className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 flex flex-col sm:flex-row gap-2"
          >
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Nhập tên danh mục mới (VD: Ghế Gaming, Tai Nghe Hi-Res)..."
              className="flex-1 px-3.5 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-all"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Danh Mục</span>
            </button>
          </form>

          {/* List of categories */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Danh mục hiện có ({categories.length}):
            </p>

            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {categories.map((cat) => {
                const isDefault = cat.id === 1 || cat.slug === 'uncategorized';

                return (
                  <div
                    key={cat.id}
                    className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-[10px] font-mono text-slate-400 border border-slate-700 shrink-0">
                        #{cat.id}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-slate-200 truncate">
                          {cat.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-mono truncate">
                          slug: {cat.slug}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
                        {cat.product_count ?? 0} thiết bị
                      </span>

                      {isDefault ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50 font-medium">
                          Mặc định
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDelete(cat)}
                          className="px-2.5 py-1 text-xs rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all flex items-center gap-1 cursor-pointer"
                          title="Xóa danh mục và chuyển giao thiết bị sang Uncategorized"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default CategoryModal;
