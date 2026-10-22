import React, { useState, useEffect } from 'react';
import { Key, Search, Layers, Plus, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

export default function PermissionManagement() {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterModule, setFilterModule] = useState('all');
  const [feedback, setFeedback] = useState({ message: '', type: '' });

  // Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({ permission_name: '', description: '', module: 'general' });

  const notify = (msg, type = 'success') => {
    setFeedback({ message: msg, type });
    setTimeout(() => setFeedback({ message: '', type: '' }), 4000);
  };

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/permissions');
      setPermissions(res.data?.permissions || []);
    } catch (err) {
      notify(err.response?.data?.message || 'Lỗi tải danh sách quyền!', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/permissions', form);
      notify('Tạo quyền hạn mới thành công!', 'success');
      setIsCreateOpen(false);
      setForm({ permission_name: '', description: '', module: 'general' });
      fetchPermissions();
    } catch (err) {
      notify(err.response?.data?.message || 'Lỗi tạo quyền hạn!', 'error');
    }
  };

  const handleDelete = async (perm) => {
    if (!window.confirm(`Xác nhận xóa quyền "${perm.permission_name}"?`)) return;
    try {
      await axiosInstance.delete(`/permissions/${perm.id}`);
      notify('Đã xóa quyền thành công!', 'success');
      fetchPermissions();
    } catch (err) {
      notify(err.response?.data?.message || 'Lỗi xóa quyền!', 'error');
    }
  };

  // Modules list
  const modules = Array.from(new Set(permissions.map((p) => p.module || 'general')));

  // Filtered
  const filtered = permissions.filter((p) => {
    const matchSearch =
      (p.permission_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(search.toLowerCase());
    const matchModule = filterModule === 'all' || p.module === filterModule;
    return matchSearch && matchModule;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700/60">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Key className="w-6 h-6 text-cyan-400" /> Quản Lý Quyền Hạn (Permissions)
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Danh mục các quyền truy cập tài nguyên API và chức năng trên toàn bộ sàn TechShop.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm transition shadow-lg shadow-cyan-600/20 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Thêm quyền mới
        </button>
      </div>

      {feedback.message && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center gap-3 border ${
            feedback.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          }`}
        >
          {feedback.type === 'error' ? <AlertCircle className="w-5 h-5 flex-shrink-0" /> : <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-800/80 p-3 rounded-2xl border border-slate-700/70">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên quyền, mô tả..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:border-cyan-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            className="w-full sm:w-48 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:border-cyan-500 outline-none"
          >
            <option value="all">Tất cả Module ({permissions.length})</option>
            {modules.map((m) => (
              <option key={m} value={m}>
                Module: {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Permissions Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-slate-800/80 rounded-2xl border border-slate-700/70 overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/80 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700">
                <tr>
                  <th className="py-3.5 px-4">ID</th>
                  <th className="py-3.5 px-4">Tên Quyền (Key)</th>
                  <th className="py-3.5 px-4">Phân Hệ (Module)</th>
                  <th className="py-3.5 px-4">Mô tả Chức năng</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Không tìm thấy quyền hạn nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-750 transition">
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-400">#{p.id}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-cyan-300">
                        {p.permission_name}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-wider text-[10px]">
                          <Layers className="w-3 h-3" /> {p.module}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-300">
                        {p.description || 'Chưa có mô tả'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(p)}
                          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition cursor-pointer"
                          title="Xóa quyền này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Tạo Quyền */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-2">Thêm Quyền Mới</h2>
            <p className="text-xs text-slate-400 mb-5">Định nghĩa định danh quyền hạn mới trong hệ thống.</p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tên quyền hạn (Key) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ví dụ: orders.cancel"
                  value={form.permission_name}
                  onChange={(e) => setForm({ ...form, permission_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Module *</label>
                <input
                  type="text"
                  required
                  placeholder="ví dụ: orders, users, products..."
                  value={form.module}
                  onChange={(e) => setForm({ ...form, module: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mô tả quyền</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả quyền cho phép làm gì..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-cyan-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/20 transition cursor-pointer"
                >
                  Tạo quyền
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
