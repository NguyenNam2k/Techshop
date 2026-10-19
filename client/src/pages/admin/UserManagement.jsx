import { useState, useEffect, useMemo } from 'react';
import axiosInstance from '../../api/axiosInstance';
import Pagination from '../../components/admin/Pagination';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Bộ lọc
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'active' | 'locked'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [createForm, setCreateForm] = useState({
    role: 'customer', name: '', email: '', password: '', phone: '',
    username: '', manager_code: '', staff_code: '', department: 'Warehouse',
    branch_name: 'TechGear Flagship Store', address: ''
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Fetch users
  const fetchUsers = async () => {
    try {
      const res = await axiosInstance.get('/users');
      setUsers(res.data.users || []);
    } catch (err) {
      console.error('Lỗi lấy danh sách user:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // Reset về trang 1 khi thay đổi các điều kiện lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterRole, filterStatus, startDate, endDate]);

  // Lọc và sắp xếp danh sách (mặc định sắp xếp từ nhỏ đến lớn)
  const filteredUsers = useMemo(() => {
    const list = users.filter(u => {
      // 1. Lọc theo Role
      if (filterRole !== 'all' && u.role !== filterRole) return false;

      // 2. Lọc theo Trạng thái (chỉ có Hoạt động hoặc Đã khóa)
      if (filterStatus === 'active' && u.status !== 'active') return false;
      if (filterStatus === 'locked' && u.status === 'active') return false;

      // 3. Lọc theo Từ ngày (startDate)
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const userDate = new Date(u.created_at);
        if (userDate < start) return false;
      }

      // 4. Lọc theo Đến ngày (endDate)
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        const userDate = new Date(u.created_at);
        if (userDate > end) return false;
      }

      // 5. Lọc theo Từ khóa (tên hoặc email hoặc sđt)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchName = u.name?.toLowerCase().includes(term);
        const matchEmail = u.email?.toLowerCase().includes(term);
        const matchPhone = u.phone?.toLowerCase().includes(term);
        if (!matchName && !matchEmail && !matchPhone) return false;
      }

      return true;
    });

    // Sắp xếp theo thứ tự nhỏ đến lớn (Cũ ➔ Mới / ID nhỏ ➔ ID lớn)
    return list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at) || a.id - b.id);
  }, [users, filterRole, filterStatus, startDate, endDate, searchTerm]);

  // Dữ liệu đã phân trang
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  // Reset bộ lọc
  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterRole('all');
    setFilterStatus('all');
    setStartDate('');
    setEndDate('');
  };

  // Toggle status (Khóa / Mở khóa)
  const handleToggleStatus = async (user) => {
    const isCurrentlyActive = user.status === 'active';
    const actionText = isCurrentlyActive ? 'khóa' : 'mở khóa';

    if (!confirm(`Bạn có chắc muốn ${actionText} tài khoản "${user.name}"?`)) return;

    const newStatus = isCurrentlyActive ? (user.role === 'customer' ? 'blocked' : 'inactive') : 'active';
    try {
      await axiosInstance.patch(`/users/${user.id}/status`, { role: user.role, status: newStatus });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi cập nhật trạng thái!');
    }
  };

  // Create user
  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      await axiosInstance.post('/users', createForm);
      setShowCreateModal(false);
      setCreateForm({ role: 'customer', name: '', email: '', password: '', phone: '', username: '', manager_code: '', staff_code: '', department: 'Warehouse', branch_name: 'TechGear Flagship Store', address: '' });
      fetchUsers();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Lỗi tạo tài khoản!');
    } finally {
      setFormLoading(false);
    }
  };

  // View detail
  const handleViewDetail = async (user) => {
    try {
      const res = await axiosInstance.get(`/users/${user.id}?role=${user.role}`);
      setSelectedUser(res.data.user);
      setShowDetailModal(true);
    } catch (err) {
      alert('Không thể lấy thông tin chi tiết!');
    }
  };

  // Hiển thị Badge trạng thái (Chỉ có Hoạt động hoặc Đã khóa)
  const statusBadge = (status) => {
    if (status === 'active') {
      return <span className="px-2.5 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">Hoạt động</span>;
    }
    return <span className="px-2.5 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-500/30 font-medium">Đã khóa</span>;
  };

  const roleBadge = (role) => {
    const styles = {
      customer: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      admin: 'bg-red-500/20 text-red-300 border-red-500/30',
      manager: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      staff: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    };
    return <span className={`px-2.5 py-0.5 rounded-full text-xs border uppercase tracking-wider font-semibold ${styles[role] || ''}`}>{role}</span>;
  };

  const formatUserId = (u) => {
    const prefixMap = {
      customer: 'CUS',
      admin: 'ADM',
      manager: 'MGR',
      staff: 'STF'
    };
    return `#${prefixMap[u.role] || 'USR'}-${u.id}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hasActiveFilters = searchTerm || filterRole !== 'all' || filterStatus !== 'all' || startDate || endDate;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">👥 Quản lý Người dùng</h1>
          <p className="text-slate-400 text-sm mt-1">Danh sách người dùng sắp xếp từ nhỏ đến lớn (#1 ➔ #N)</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-blue-500/20"
        >
          + Thêm người dùng mới
        </button>
      </div>

      {/* Filter Panel */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4 mb-6 space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Tìm kiếm tên/email */}
          <div className="flex-1 min-w-[220px]">
            <label className="block text-slate-400 text-xs mb-1">🔍 Tìm kiếm</label>
            <input
              type="text"
              placeholder="Tìm theo tên, email hoặc SĐT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-700/80 text-white placeholder-slate-400 border border-slate-600 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Lọc Role */}
          <div className="w-40">
            <label className="block text-slate-400 text-xs mb-1">🛡️ Vai trò (Role)</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full bg-slate-700/80 text-white border border-slate-600 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 transition cursor-pointer"
            >
              <option value="all">Tất cả Role</option>
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="staff">Staff</option>
            </select>
          </div>

          {/* Lọc Status (Chỉ có Hoạt động hoặc Đã khóa) */}
          <div className="w-44">
            <label className="block text-slate-400 text-xs mb-1">⚡ Trạng thái</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-slate-700/80 text-white border border-slate-600 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 transition cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="locked">Đã khóa</option>
            </select>
          </div>

          {/* Lọc Ngày tạo: Từ ngày */}
          <div className="w-40">
            <label className="block text-slate-400 text-xs mb-1">📅 Ngày tạo từ</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-700/80 text-white border border-slate-600 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Lọc Ngày tạo: Đến ngày */}
          <div className="w-40">
            <label className="block text-slate-400 text-xs mb-1">📅 Đến ngày</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-700/80 text-white border border-slate-600 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Nút reset bộ lọc */}
          {hasActiveFilters && (
            <div className="self-end pb-0.5">
              <button
                onClick={handleResetFilters}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-xl transition border border-slate-600"
              >
                🔄 Xóa bộ lọc
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/50">
                <th className="text-left px-5 py-3.5 text-slate-400 font-medium">ID</th>
                <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Tên</th>
                <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Email</th>
                <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Role</th>
                <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Trạng thái</th>
                <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Ngày tạo</th>
                <th className="text-center px-5 py-3.5 text-slate-400 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((u) => (
                <tr key={`${u.role}-${u.id}`} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition">
                  <td className="px-5 py-3 text-slate-300 font-mono text-xs font-semibold">{formatUserId(u)}</td>
                  <td className="px-5 py-3 text-white font-medium">{u.name}</td>
                  <td className="px-5 py-3 text-slate-300">{u.email}</td>
                  <td className="px-5 py-3">{roleBadge(u.role)}</td>
                  <td className="px-5 py-3">{statusBadge(u.status)}</td>
                  <td className="px-5 py-3 text-slate-400">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '—'}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleViewDetail(u)} className="text-blue-400 hover:text-blue-300 text-xs px-2.5 py-1 rounded-lg hover:bg-blue-500/10 transition font-medium">
                        👁️ Chi tiết
                      </button>
                      <button onClick={() => handleToggleStatus(u)} className={`text-xs px-2.5 py-1 rounded-lg transition font-medium ${u.status === 'active' ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10' : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'}`}>
                        {u.status === 'active' ? '🔒 Khóa' : '🔓 Mở khóa'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    🔍 Không tìm thấy người dùng nào phù hợp với điều kiện lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Component phân trang */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredUsers.length}
          itemsPerPage={itemsPerPage}
          onPageChange={(page) => setCurrentPage(page)}
          onItemsPerPageChange={(size) => {
            setItemsPerPage(size);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* ===== MODAL: Create User ===== */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Thêm người dùng mới</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-500 hover:text-white text-xl">✕</button>
            </div>
            <form onSubmit={handleCreate} className="px-6 py-4 space-y-4">
              {formError && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 text-red-400 text-sm">⚠️ {formError}</div>}

              <div>
                <label className="block text-slate-300 text-sm mb-1">Role *</label>
                <select value={createForm.role} onChange={(e) => setCreateForm(f => ({ ...f, role: e.target.value }))} className="w-full bg-slate-700 text-white border border-slate-600 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500">
                  <option value="customer">Customer</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="staff">Staff</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 text-sm mb-1">Họ và tên *</label>
                <input type="text" value={createForm.name} onChange={(e) => setCreateForm(f => ({ ...f, name: e.target.value }))} className="w-full bg-slate-700 text-white border border-slate-600 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500" placeholder="Nhập họ và tên" />
              </div>

              <div>
                <label className="block text-slate-300 text-sm mb-1">Email *</label>
                <input type="email" value={createForm.email} onChange={(e) => setCreateForm(f => ({ ...f, email: e.target.value }))} className="w-full bg-slate-700 text-white border border-slate-600 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500" placeholder="Nhập email" />
              </div>

              <div>
                <label className="block text-slate-300 text-sm mb-1">
                  Mật khẩu <span className="text-slate-400 text-xs font-normal">(Nếu để trống, mật khẩu mặc định sẽ là 123456)</span>
                </label>
                <input type="password" value={createForm.password} onChange={(e) => setCreateForm(f => ({ ...f, password: e.target.value }))} className="w-full bg-slate-700 text-white border border-slate-600 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500" placeholder="Mặc định: 123456" />
              </div>

              <div>
                <label className="block text-slate-300 text-sm mb-1">Số điện thoại</label>
                <input type="text" value={createForm.phone} onChange={(e) => setCreateForm(f => ({ ...f, phone: e.target.value }))} className="w-full bg-slate-700 text-white border border-slate-600 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500" placeholder="Nhập SĐT" />
              </div>

              {/* Conditional fields */}
              {createForm.role === 'admin' && (
                <div>
                  <label className="block text-slate-300 text-sm mb-1">Username *</label>
                  <input type="text" value={createForm.username} onChange={(e) => setCreateForm(f => ({ ...f, username: e.target.value }))} className="w-full bg-slate-700 text-white border border-slate-600 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500" placeholder="admin_username" />
                </div>
              )}

              {createForm.role === 'manager' && (
                <>
                  <div>
                    <label className="block text-slate-300 text-sm mb-1">Mã quản lý *</label>
                    <input type="text" value={createForm.manager_code} onChange={(e) => setCreateForm(f => ({ ...f, manager_code: e.target.value }))} className="w-full bg-slate-700 text-white border border-slate-600 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500" placeholder="MGR001" />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-sm mb-1">Chi nhánh</label>
                    <input type="text" value={createForm.branch_name} onChange={(e) => setCreateForm(f => ({ ...f, branch_name: e.target.value }))} className="w-full bg-slate-700 text-white border border-slate-600 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500" />
                  </div>
                </>
              )}

              {createForm.role === 'staff' && (
                <>
                  <div>
                    <label className="block text-slate-300 text-sm mb-1">Mã nhân viên *</label>
                    <input type="text" value={createForm.staff_code} onChange={(e) => setCreateForm(f => ({ ...f, staff_code: e.target.value }))} className="w-full bg-slate-700 text-white border border-slate-600 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500" placeholder="STF001" />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-sm mb-1">Phòng ban</label>
                    <select value={createForm.department} onChange={(e) => setCreateForm(f => ({ ...f, department: e.target.value }))} className="w-full bg-slate-700 text-white border border-slate-600 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500">
                      <option value="Warehouse">Warehouse</option>
                      <option value="Sales">Sales</option>
                      <option value="Customer Support">Customer Support</option>
                    </select>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-xl transition">Hủy</button>
                <button type="submit" disabled={formLoading} className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition">
                  {formLoading ? 'Đang tạo...' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: User Detail ===== */}
      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Chi tiết Người dùng</h2>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-500 hover:text-white text-xl">✕</button>
            </div>
            <div className="px-6 py-4 space-y-3">
              {Object.entries(selectedUser).map(([key, val]) => (
                <div key={key} className="flex justify-between border-b border-slate-700/50 pb-2">
                  <span className="text-slate-400 text-sm">{key}</span>
                  <span className="text-white text-sm font-medium max-w-[60%] text-right truncate">{val?.toString() || '—'}</span>
                </div>
              ))}
            </div>
            <div className="px-6 py-4">
              <button onClick={() => setShowDetailModal(false)} className="w-full px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-xl transition">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
