import { useState, useEffect, useMemo } from 'react';
import axiosInstance from '../../api/axiosInstance';
import Pagination from '../../components/admin/Pagination';

function PermissionManagement() {
  const [permissions, setPermissions] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterModule, setFilterModule] = useState('all');

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingPerm, setEditingPerm] = useState(null);
  const [formData, setFormData] = useState({ permission_name: '', description: '', module: '' });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Fetch permissions
  const fetchPermissions = async () => {
    try {
      const res = await axiosInstance.get('/permissions');
      setPermissions(res.data.permissions || []);
      setModules(res.data.modules || []);
    } catch (err) {
      console.error('Lỗi lấy danh sách quyền:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPermissions(); }, []);

  // Reset về trang 1 khi lọc module
  useEffect(() => {
    setCurrentPage(1);
  }, [filterModule]);

  // Filter by module
  const filteredPermissions = useMemo(() => {
    return filterModule === 'all'
      ? permissions
      : permissions.filter(p => p.module === filterModule);
  }, [permissions, filterModule]);

  // Phân trang
  const totalPages = Math.ceil(filteredPermissions.length / itemsPerPage) || 1;
  const paginatedPermissions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPermissions.slice(start, start + itemsPerPage);
  }, [filteredPermissions, currentPage, itemsPerPage]);

  // Open Create modal
  const openCreate = () => {
    setEditingPerm(null);
    setFormData({ permission_name: '', description: '', module: '' });
    setFormError('');
    setShowFormModal(true);
  };

  // Open Edit modal
  const openEdit = (perm) => {
    setEditingPerm(perm);
    setFormData({
      permission_name: perm.permission_name,
      description: perm.description || '',
      module: perm.module || ''
    });
    setFormError('');
    setShowFormModal(true);
  };

  // Submit Create/Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      if (editingPerm) {
        await axiosInstance.put(`/permissions/${editingPerm.id}`, formData);
      } else {
        await axiosInstance.post('/permissions', formData);
      }
      setShowFormModal(false);
      fetchPermissions();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Lỗi xử lý quyền!');
    } finally {
      setFormLoading(false);
    }
  };

  // Delete permission
  const handleDelete = async (perm) => {
    if (!confirm(`Bạn có chắc muốn xóa quyền "${perm.permission_name}"?`)) return;
    try {
      await axiosInstance.delete(`/permissions/${perm.id}`);
      fetchPermissions();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi xóa quyền!');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">🔑 Quản lý Quyền hạn</h1>
          <p className="text-slate-400 text-sm mt-1">Danh sách tất cả các quyền hạn theo Module trong hệ thống</p>
        </div>
        <button onClick={openCreate} className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-blue-500/20">
          + Thêm quyền mới
        </button>
      </div>

      {/* Filter by module */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setFilterModule('all')} className={`px-4 py-1.5 rounded-xl text-sm transition font-medium ${filterModule === 'all' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'}`}>
          Tất cả ({permissions.length})
        </button>
        {modules.map(m => (
          <button key={m} onClick={() => setFilterModule(m)} className={`px-4 py-1.5 rounded-xl text-sm transition font-medium ${filterModule === m ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'}`}>
            {m} ({permissions.filter(p => p.module === m).length})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/50">
                <th className="text-left px-5 py-3.5 text-slate-400 font-medium">ID</th>
                <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Tên quyền</th>
                <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Mô tả</th>
                <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Module</th>
                <th className="text-center px-5 py-3.5 text-slate-400 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPermissions.map(p => (
                <tr key={p.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition">
                  <td className="px-5 py-3 text-slate-300 font-mono text-xs">#{p.id}</td>
                  <td className="px-5 py-3">
                    <span className="text-white font-mono text-xs bg-slate-700/80 px-2.5 py-1 rounded-lg border border-slate-600/50">{p.permission_name}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-400">{p.description || '—'}</td>
                  <td className="px-5 py-3">
                    <span className="px-2.5 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full border border-purple-500/30 font-medium">{p.module}</span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEdit(p)} className="text-amber-400 hover:text-amber-300 text-xs px-2.5 py-1 rounded-lg hover:bg-amber-500/10 transition font-medium">✏️ Sửa</button>
                      <button onClick={() => handleDelete(p)} className="text-red-400 hover:text-red-300 text-xs px-2.5 py-1 rounded-lg hover:bg-red-500/10 transition font-medium">🗑️ Xóa</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPermissions.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-500">Không có quyền nào trong module này.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Component phân trang */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredPermissions.length}
          itemsPerPage={itemsPerPage}
          onPageChange={(page) => setCurrentPage(page)}
          onItemsPerPageChange={(size) => {
            setItemsPerPage(size);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* ===== MODAL: Create/Edit Permission ===== */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">{editingPerm ? 'Sửa quyền' : 'Thêm quyền mới'}</h2>
              <button onClick={() => setShowFormModal(false)} className="text-slate-500 hover:text-white text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              {formError && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 text-red-400 text-sm">⚠️ {formError}</div>}
              <div>
                <label className="block text-slate-300 text-sm mb-1">Tên quyền * <span className="text-slate-500">(ví dụ: products.create)</span></label>
                <input type="text" value={formData.permission_name} onChange={(e) => setFormData(f => ({ ...f, permission_name: e.target.value }))} className="w-full bg-slate-700 text-white border border-slate-600 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 font-mono" placeholder="module.action" />
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-1">Mô tả</label>
                <input type="text" value={formData.description} onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))} className="w-full bg-slate-700 text-white border border-slate-600 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500" placeholder="Mô tả quyền hạn..." />
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-1">Module *</label>
                <input type="text" value={formData.module} onChange={(e) => setFormData(f => ({ ...f, module: e.target.value }))} list="module-list" className="w-full bg-slate-700 text-white border border-slate-600 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500" placeholder="users, roles, products..." />
                <datalist id="module-list">
                  {modules.map(m => <option key={m} value={m} />)}
                </datalist>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowFormModal(false)} className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-xl transition">Hủy</button>
                <button type="submit" disabled={formLoading} className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition">
                  {formLoading ? 'Đang xử lý...' : editingPerm ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PermissionManagement;
