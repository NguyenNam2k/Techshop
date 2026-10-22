import React, { useState, useEffect } from 'react';
import {
  Shield,
  Plus,
  Key,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Check,
  X,
  Layers
} from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

export default function RoleManagement() {
  const [roles, setRoles] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ message: '', type: '' });

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ role_name: '', description: '', is_active: 1 });
  
  const [isPermsOpen, setIsPermsOpen] = useState(false);
  const [activeRole, setActiveRole] = useState(null);
  const [selectedPermIds, setSelectedPermIds] = useState([]);
  const [savingPerms, setSavingPerms] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ id: null, description: '', is_active: 1, role_name: '' });

  const notify = (msg, type = 'success') => {
    setFeedback({ message: msg, type });
    setTimeout(() => setFeedback({ message: '', type: '' }), 4000);
  };

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const [rolesRes, permsRes] = await Promise.all([
        axiosInstance.get('/roles'),
        axiosInstance.get('/permissions')
      ]);
      setRoles(rolesRes.data?.roles || []);
      setAllPermissions(permsRes.data?.permissions || []);
    } catch (err) {
      notify(err.response?.data?.message || 'Lỗi tải dữ liệu vai trò!', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  // Open Permissions Configuration Modal
  const handleOpenPermsModal = async (role) => {
    setActiveRole(role);
    try {
      const res = await axiosInstance.get(`/roles/${role.id}/permissions`);
      const assigned = res.data?.permissions || [];
      setSelectedPermIds(assigned.map((p) => p.id));
      setIsPermsOpen(true);
    } catch (err) {
      notify(err.response?.data?.message || 'Không thể tải quyền của vai trò này', 'error');
    }
  };

  const handleTogglePerm = (permId) => {
    setSelectedPermIds((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const handleSavePermissions = async () => {
    if (!activeRole) return;
    setSavingPerms(true);
    try {
      await axiosInstance.post(`/roles/${activeRole.id}/permissions`, {
        permissionIds: selectedPermIds
      });
      notify(`Đã cập nhật phân quyền cho vai trò ${activeRole.role_name}!`, 'success');
      setIsPermsOpen(false);
      fetchRoles();
    } catch (err) {
      notify(err.response?.data?.message || 'Lỗi lưu phân quyền!', 'error');
    } finally {
      setSavingPerms(false);
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/roles', createForm);
      notify('Tạo vai trò mới thành công!', 'success');
      setIsCreateOpen(false);
      setCreateForm({ role_name: '', description: '', is_active: 1 });
      fetchRoles();
    } catch (err) {
      notify(err.response?.data?.message || 'Lỗi tạo vai trò!', 'error');
    }
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.put(`/roles/${editForm.id}`, {
        description: editForm.description,
        is_active: editForm.is_active
      });
      notify('Cập nhật vai trò thành công!', 'success');
      setIsEditOpen(false);
      fetchRoles();
    } catch (err) {
      notify(err.response?.data?.message || 'Lỗi cập nhật vai trò!', 'error');
    }
  };

  const handleDeleteRole = async (role) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vai trò "${role.role_name}" không?`)) return;
    try {
      await axiosInstance.delete(`/roles/${role.id}`);
      notify('Đã xóa vai trò thành công!', 'success');
      fetchRoles();
    } catch (err) {
      notify(err.response?.data?.message || 'Không thể xóa vai trò này!', 'error');
    }
  };

  // Group all permissions by module
  const permsByModule = allPermissions.reduce((acc, p) => {
    const mod = p.module || 'general';
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(p);
    return acc;
  }, {});

  const systemRoles = ['super_admin', 'system_admin', 'admin', 'manager', 'staff', 'customer'];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700/60">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-400" /> Quản Lý Vai Trò & Phân Quyền (RBAC)
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Thiết lập danh sách các vai trò trong hệ thống và phân quyền chi tiết theo từng chức năng.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition shadow-lg shadow-blue-600/20 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Thêm vai trò mới
        </button>
      </div>

      {/* Alert Notification */}
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

      {/* Roles Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {roles.map((r) => {
            const isSystem = systemRoles.includes(r.role_name.toLowerCase());
            return (
              <div
                key={r.id}
                className="bg-slate-800/80 rounded-2xl border border-slate-700/70 p-6 flex flex-col justify-between hover:border-slate-600 transition shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white capitalize">{r.role_name}</h3>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400">
                          ID: #{r.id}
                        </span>
                      </div>
                    </div>

                    {isSystem ? (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        Hệ thống
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20">
                        Tùy chỉnh
                      </span>
                    )}
                  </div>

                  <p className="text-slate-300 text-sm mb-4 min-h-[40px] line-clamp-2">
                    {r.description || 'Chưa có mô tả chi tiết cho vai trò này.'}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-slate-400 py-2 border-y border-slate-700/50 mb-4">
                    <Key className="w-3.5 h-3.5 text-blue-400" />
                    <span>Đã cấp:</span>
                    <span className="font-bold text-white bg-blue-500/20 px-2 py-0.5 rounded-md border border-blue-500/30">
                      {r.permission_count || 0} quyền
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleOpenPermsModal(r)}
                    className="flex-1 py-2 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-blue-200 border border-blue-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Key className="w-3.5 h-3.5" /> Phân quyền
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditForm({
                        id: r.id,
                        role_name: r.role_name,
                        description: r.description || '',
                        is_active: r.is_active ? 1 : 0
                      });
                      setIsEditOpen(true);
                    }}
                    className="p-2 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600/50 transition cursor-pointer"
                    title="Chỉnh sửa thông tin"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {!isSystem && (
                    <button
                      type="button"
                      onClick={() => handleDeleteRole(r)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition cursor-pointer"
                      title="Xóa vai trò"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Phân Quyền (Permissions Matrix) */}
      {isPermsOpen && activeRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Key className="w-5 h-5 text-blue-400" /> Phân quyền vai trò: <span className="text-cyan-400 uppercase">{activeRole.role_name}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Đánh dấu các quyền mà người dùng có vai trò này được phép thực thi trên hệ thống.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPermsOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
              {Object.keys(permsByModule).map((moduleName) => (
                <div key={moduleName} className="bg-slate-950/60 rounded-2xl border border-slate-800/80 p-4">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-blue-400" /> Module: {moduleName}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const modPermIds = permsByModule[moduleName].map((p) => p.id);
                        const allSelected = modPermIds.every((id) => selectedPermIds.includes(id));
                        if (allSelected) {
                          setSelectedPermIds((prev) => prev.filter((id) => !modPermIds.includes(id)));
                        } else {
                          setSelectedPermIds((prev) => [...new Set([...prev, ...modPermIds])]);
                        }
                      }}
                      className="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer"
                    >
                      Chọn / Bỏ tất cả
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {permsByModule[moduleName].map((perm) => {
                      const isChecked = selectedPermIds.includes(perm.id);
                      return (
                        <label
                          key={perm.id}
                          className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition select-none ${
                            isChecked
                              ? 'bg-blue-600/15 border-blue-500/40 text-slate-100'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleTogglePerm(perm.id)}
                            className="mt-0.5 rounded border-slate-700 text-blue-500 focus:ring-0 cursor-pointer"
                          />
                          <div>
                            <div className="font-semibold text-slate-200 font-mono text-[11px]">
                              {perm.permission_name}
                            </div>
                            <div className="text-slate-400 text-[11px] mt-0.5">
                              {perm.description || 'Không có mô tả'}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Đã chọn: <strong className="text-white">{selectedPermIds.length}</strong> quyền
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsPermsOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={savingPerms}
                  onClick={handleSavePermissions}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition cursor-pointer flex items-center gap-1.5"
                >
                  {savingPerms ? (
                    'Đang lưu...'
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" /> Lưu phân quyền
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Tạo vai trò mới */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-2">Thêm Vai Trò Mới</h2>
            <p className="text-xs text-slate-400 mb-5">
              Định nghĩa vai trò người dùng tùy chỉnh cho hệ sinh thái TechShop.
            </p>

            <form onSubmit={handleCreateRole} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tên vai trò (Key ID) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ví dụ: warehouse_lead"
                  value={createForm.role_name}
                  onChange={(e) => setCreateForm({ ...createForm, role_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Mô tả vai trò
                </label>
                <textarea
                  rows={3}
                  placeholder="Mô tả trách nhiệm của vai trò này..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-blue-500 outline-none"
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
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition cursor-pointer"
                >
                  Tạo vai trò
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Sửa vai trò */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-2">Chỉnh Sửa Vai Trò</h2>
            <p className="text-xs text-slate-400 mb-5">
              Cập nhật thông tin và trạng thái cho vai trò <strong className="text-cyan-400">{editForm.role_name}</strong>
            </p>

            <form onSubmit={handleUpdateRole} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mô tả</label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Trạng thái</label>
                <select
                  value={editForm.is_active}
                  onChange={(e) => setEditForm({ ...editForm, is_active: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-blue-500 outline-none"
                >
                  <option value={1}>Hoạt động (Active)</option>
                  <option value={0}>Tạm ngưng (Inactive)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
