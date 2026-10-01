import { useState, useEffect, useMemo } from 'react';
import axiosInstance from '../../api/axiosInstance';
import Pagination from '../../components/admin/Pagination';

function RoleManagement() {
  const [roles, setRoles] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedPermIds, setSelectedPermIds] = useState([]);

  const [formData, setFormData] = useState({ role_name: '', description: '' });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const protectedRoles = ['super_admin', 'system_admin', 'manager', 'staff', 'customer'];

  // Fetch roles + permissions
  const fetchData = async () => {
    try {
      const [rolesRes, permsRes] = await Promise.all([
        axiosInstance.get('/roles'),
        axiosInstance.get('/permissions')
      ]);
      setRoles(rolesRes.data.roles || []);
      setAllPermissions(permsRes.data.permissions || []);
    } catch (err) {
      console.error('Lỗi lấy dữ liệu:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Phân trang
  const totalPages = Math.ceil(roles.length / itemsPerPage) || 1;
  const paginatedRoles = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return roles.slice(start, start + itemsPerPage);
  }, [roles, currentPage, itemsPerPage]);

  // Open Create modal
  const openCreate = () => {
    setEditingRole(null);
    setFormData({ role_name: '', description: '' });
    setFormError('');
    setShowFormModal(true);
  };

  // Open Edit modal
  const openEdit = (role) => {
    setEditingRole(role);
    setFormData({ role_name: role.role_name, description: role.description || '' });
    setFormError('');
    setShowFormModal(true);
  };

  // Submit Create/Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      if (editingRole) {
        await axiosInstance.put(`/roles/${editingRole.id}`, formData);
      } else {
        await axiosInstance.post('/roles', formData);
      }
      setShowFormModal(false);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Lỗi xử lý vai trò!');
    } finally {
      setFormLoading(false);
    }
  };

  // Delete role
  const handleDelete = async (role) => {
    if (!confirm(`Bạn có chắc muốn xóa vai trò "${role.role_name}"?`)) return;
    try {
      await axiosInstance.delete(`/roles/${role.id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi xóa vai trò!');
    }
  };

  // Open Assign Permissions modal
  const openAssign = (role) => {
    setSelectedRole(role);
    setSelectedPermIds(role.permissions?.map(p => p.id) || []);
    setShowAssignModal(true);
  };

  // Toggle permission checkbox
  const togglePerm = (permId) => {
    setSelectedPermIds(prev =>
      prev.includes(permId) ? prev.filter(id => id !== permId) : [...prev, permId]
    );
  };

  // Submit Assign
  const handleAssign = async () => {
    try {
      await axiosInstance.post(`/roles/${selectedRole.id}/permissions`, { permission_ids: selectedPermIds });
      setShowAssignModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi gán quyền!');
    }
  };

  // Group permissions by module
  const groupedPermissions = allPermissions.reduce((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {});

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
          <h1 className="text-2xl font-bold text-white">🏷️ Quản lý Vai trò</h1>
          <p className="text-slate-400 text-sm mt-1">Danh sách vai trò và phân quyền trong hệ thống</p>
        </div>
        <button onClick={openCreate} className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-blue-500/20">
          + Thêm vai trò
        </button>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {paginatedRoles.map(role => (
          <div key={role.id} className="bg-slate-800 rounded-2xl border border-slate-700 p-5 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-white font-bold text-lg">{role.role_name}</h3>
                  <p className="text-slate-400 text-sm mt-0.5">{role.description || 'Không có mô tả'}</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${role.is_active ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                  {role.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Permissions tags */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {role.permissions?.length > 0 ? (
                  role.permissions.map(p => (
                    <span key={p.id} className="px-2 py-0.5 bg-slate-700/80 text-slate-300 text-xs rounded-lg border border-slate-600">
                      {p.permission_name}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 text-xs italic">Chưa gán quyền nào</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 border-t border-slate-700/80 pt-3 mt-2">
              <button onClick={() => openAssign(role)} className="text-blue-400 hover:text-blue-300 text-xs px-3 py-1.5 rounded-lg hover:bg-blue-500/10 transition font-medium">🔑 Gán quyền</button>
              <button onClick={() => openEdit(role)} className="text-amber-400 hover:text-amber-300 text-xs px-3 py-1.5 rounded-lg hover:bg-amber-500/10 transition font-medium">✏️ Sửa</button>
              {!protectedRoles.includes(role.role_name) && (
                <button onClick={() => handleDelete(role)} className="text-red-400 hover:text-red-300 text-xs px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition font-medium">🗑️ Xóa</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination for Roles */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-lg">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={roles.length}
          itemsPerPage={itemsPerPage}
          onPageChange={(page) => setCurrentPage(page)}
          onItemsPerPageChange={(size) => {
            setItemsPerPage(size);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* ===== MODAL: Create/Edit Role ===== */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">{editingRole ? 'Sửa vai trò' : 'Thêm vai trò mới'}</h2>
              <button onClick={() => setShowFormModal(false)} className="text-slate-500 hover:text-white text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              {formError && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 text-red-400 text-sm">⚠️ {formError}</div>}
              <div>
                <label className="block text-slate-300 text-sm mb-1">Tên vai trò *</label>
                <input type="text" value={formData.role_name} onChange={(e) => setFormData(f => ({ ...f, role_name: e.target.value }))} disabled={editingRole && protectedRoles.includes(editingRole.role_name)} className="w-full bg-slate-700 text-white border border-slate-600 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 disabled:opacity-50" placeholder="Ví dụ: content_editor" />
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-1">Mô tả</label>
                <textarea value={formData.description} onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))} className="w-full bg-slate-700 text-white border border-slate-600 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 resize-none" rows={3} placeholder="Mô tả vai trò..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowFormModal(false)} className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-xl transition">Hủy</button>
                <button type="submit" disabled={formLoading} className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition">
                  {formLoading ? 'Đang xử lý...' : editingRole ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: Assign Permissions ===== */}
      {showAssignModal && selectedRole && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center sticky top-0 bg-slate-800 z-10">
              <h2 className="text-lg font-bold text-white">🔑 Gán quyền cho <span className="text-blue-400">{selectedRole.role_name}</span></h2>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-500 hover:text-white text-xl">✕</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              {Object.entries(groupedPermissions).map(([module, perms]) => (
                <div key={module}>
                  <h3 className="text-slate-300 text-sm font-semibold uppercase tracking-wider mb-2">📁 {module}</h3>
                  <div className="space-y-1.5">
                    {perms.map(p => (
                      <label key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-700/50 cursor-pointer transition">
                        <input type="checkbox" checked={selectedPermIds.includes(p.id)} onChange={() => togglePerm(p.id)} className="w-4 h-4 rounded accent-blue-500" />
                        <div className="flex-1">
                          <span className="text-white text-sm">{p.permission_name}</span>
                          {p.description && <span className="text-slate-500 text-xs ml-2">— {p.description}</span>}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-slate-700 flex gap-3 sticky bottom-0 bg-slate-800">
              <button onClick={() => setShowAssignModal(false)} className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-xl transition">Hủy</button>
              <button onClick={handleAssign} className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition">
                Lưu ({selectedPermIds.length} quyền)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoleManagement;
