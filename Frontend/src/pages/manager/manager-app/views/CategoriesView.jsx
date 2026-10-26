import React, { useState } from 'react';
import {
  FolderTree,
  Plus,
  Trash2,
  Search,
  Tag,
  Boxes,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { showToast } from '../components/Toast';

export default function CategoriesView({
  categories = [],
  onRefreshCategories
}) {
  const [newCatName, setNewCatName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

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

      showToast(`Đã thêm danh mục: "${newCatName.trim()}"`, 'success');
      setNewCatName('');
      onRefreshCategories?.();
    } catch (err) {
      showToast(err.message || 'Lỗi thêm danh mục', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteCategory = async (cat) => {
    const confirmMsg = `Bạn có chắc muốn xóa danh mục "${cat.name}"?\n(Toàn bộ ${cat.product_count ?? 0} sản phẩm thuộc danh mục này sẽ tự động chuyển sang 'Chưa phân loại' - Uncategorized)`;
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

  const filteredCategories = categories.filter((c) =>
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.slug || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalDevices = categories.reduce((sum, c) => sum + (Number(c.product_count) || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <FolderTree className="w-6 h-6 text-emerald-400" />
            <span>Quản Lý Danh Mục Phần Cứng</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Phân loại thiết bị phần cứng công nghệ và chính sách chuyển giao dữ liệu an toàn
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300">
            Tổng: <span className="text-emerald-400 font-bold">{categories.length}</span> danh mục (
            <span className="text-cyan-400 font-bold">{totalDevices}</span> thiết bị)
          </div>
        </div>
      </div>

      {/* Top Creation & Filter Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Create form */}
        <form
          onSubmit={handleCreateCategory}
          className="lg:col-span-8 glass-card rounded-2xl p-3 border border-slate-800 flex flex-col sm:flex-row gap-2"
        >
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="Nhập tên danh mục mới (VD: Ghế công thái học, Bàn nâng hạ...)"
            className="flex-1 px-4 py-2 text-xs bg-slate-800/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
          />
          <button
            type="submit"
            disabled={isCreating}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
          >
            {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span>Tạo Danh Mục</span>
          </button>
        </form>

        {/* Search */}
        <div className="lg:col-span-4 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên danh mục, slug..."
            className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-800/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map((cat) => {
          const isDefault = cat.id === 1 || cat.slug === 'uncategorized';
          return (
            <div
              key={cat.id}
              className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-slate-700 transition-all group relative overflow-hidden flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-mono text-cyan-400 font-bold">
                    #{cat.id}
                  </span>
                  {isDefault ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/50">
                      Mặc định hệ thống
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                      Tùy chỉnh
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-1">slug: {cat.slug}</p>
                {cat.description && (
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">{cat.description}</p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 font-mono text-slate-300 bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-700/50">
                  <Boxes className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{cat.product_count ?? 0} thiết bị</span>
                </span>

                {!isDefault && (
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat)}
                    disabled={deletingId === cat.id}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all flex items-center gap-1 text-[11px] disabled:opacity-50"
                    title="Xóa danh mục và chuyển giao thiết bị sang Uncategorized"
                  >
                    {deletingId === cat.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    <span>Xóa</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
