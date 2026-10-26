import React, { useState } from 'react';
import { FolderTree, X, Plus, Trash2, Loader2 } from 'lucide-react';
import { showToast } from './Toast';

export default function CategoryModal({
  isOpen,
  categories = [],
  onClose,
  onRefreshCategories
}) {
  const [newCatName, setNewCatName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  if (!isOpen) return null;

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      showToast('Vui lòng nhập tên danh mục!', 'warning');
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName.trim() })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Lỗi thêm danh mục');

      showToast(`Đã thêm danh mục: ${newCatName}`, 'success');
      setNewCatName('');
      onRefreshCategories?.();
    } catch (err) {
      showToast(err.message || 'Lỗi thêm danh mục', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteCategory = async (cat) => {
    const confirmMsg = `Bạn có chắc muốn xóa danh mục "${cat.name}"?\n(Toàn bộ ${cat.product_count ?? 0} sản phẩm trong danh mục này sẽ tự động chuyển sang danh mục mặc định 'Chưa phân loại' - Uncategorized)`;
    if (!window.confirm(confirmMsg)) return;

    setDeletingId(cat.id);
    try {
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Lỗi xóa danh mục');

      showToast(`Đã xóa danh mục "${cat.name}" và chuyển giao sản phẩm thành công!`, 'success');
      onRefreshCategories?.();
    } catch (err) {
      showToast(err.message || 'Lỗi xóa danh mục', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-card rounded-2xl w-full max-w-2xl border border-slate-800 overflow-hidden shadow-2xl animate-scale-in">
        <div className="p-5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Quản Lý Danh Mục</h3>
              <p className="text-xs text-slate-400">
                Quản lý và chuyển giao sản phẩm sang danh mục mặc định khi xóa
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Create Category Form */}
          <form
            onSubmit={handleCreateCategory}
            className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 flex flex-col sm:flex-row gap-2"
          >
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              required
              placeholder="Tên danh mục mới (VD: Tai nghe Gaming)..."
              className="flex-1 px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={isCreating}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
            >
              {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>Thêm Danh Mục</span>
            </button>
          </form>

          {/* Category List */}
          <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Danh mục hiện có ({categories.length}):
            </p>
            <div className="space-y-1.5">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-[10px] font-mono text-slate-400 border border-slate-700">
                      #{cat.id}
                    </span>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200">{cat.name}</h4>
                      <p className="text-[11px] text-slate-400 font-mono">slug: {cat.slug}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {cat.product_count ?? 0} thiết bị
                    </span>

                    {cat.id !== 1 && cat.slug !== 'uncategorized' ? (
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat)}
                        disabled={deletingId === cat.id}
                        className="px-2.5 py-1 text-xs rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all flex items-center gap-1 disabled:opacity-50"
                        title="Xóa danh mục và chuyển giao sản phẩm sang Uncategorized"
                      >
                        {deletingId === cat.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        <span>Xóa</span>
                      </button>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50">
                        Mặc định
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
