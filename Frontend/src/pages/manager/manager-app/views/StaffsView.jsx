import React, { useState, useEffect } from 'react';
import {
  UserCog,
  ShieldCheck,
  ClipboardCheck,
  Calendar,
  Award,
  Search,
  UserPlus,
  Sparkles,
  Check,
  Send,
  CalendarPlus,
  RefreshCw,
  Edit,
  Trash2,
  Loader2,
  Clock,
  X
} from 'lucide-react';
import { showToast } from '../components/Toast';

export default function StaffsView({ onStaffUpdated }) {
  const [activeTab, setActiveTab] = useState('roles'); // 'roles' | 'tasks' | 'schedules' | 'performance'
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [staffSearch, setStaffSearch] = useState('');
  const [staffDeptFilter, setStaffDeptFilter] = useState('all');

  // Staff Form
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [staffForm, setStaffForm] = useState({
    staff_code: '',
    full_name: '',
    email: '',
    phone: '',
    department: 'Warehouse',
    status: 'active',
    perm_manage_stock: true,
    perm_process_orders: false,
    perm_handle_tickets: false,
    perm_view_reports: false
  });

  // Tasks state
  const [tasks, setTasks] = useState([]);
  const [taskFilterStatus, setTaskFilterStatus] = useState('all');
  const [taskForm, setTaskForm] = useState({
    title: '',
    assigned_to: '',
    priority: 'medium',
    description: '',
    due_date: ''
  });

  // Schedules state
  const [schedules, setSchedules] = useState([]);
  const [schedForm, setSchedForm] = useState({
    staff_id: '',
    shift_date: new Date().toISOString().split('T')[0],
    shift_name: 'morning'
  });

  // Performance state
  const [performance, setPerformance] = useState([]);

  const fetchStaffs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/staffs');
      const data = await res.json();
      if (data.success) {
        setStaffs(data.data || []);
      }
    } catch (err) {
      showToast('Không thể tải danh sách nhân viên', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/staffs/tasks');
      const data = await res.json();
      if (data.success) setTasks(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSchedules = async () => {
    try {
      const res = await fetch('/api/staffs/schedules');
      const data = await res.json();
      if (data.success) setSchedules(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPerformance = async () => {
    try {
      const res = await fetch('/api/staffs/performance');
      const data = await res.json();
      if (data.success) setPerformance(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStaffs();
    if (activeTab === 'tasks') fetchTasks();
    if (activeTab === 'schedules') fetchSchedules();
    if (activeTab === 'performance') fetchPerformance();
  }, [activeTab]);

  const handleDeptChange = (dept) => {
    const isWarehouse = dept === 'Warehouse';
    const isSales = dept === 'Sales';
    const isSupport = dept === 'Customer Support';

    setStaffForm((prev) => ({
      ...prev,
      department: dept,
      perm_manage_stock: isWarehouse,
      perm_process_orders: isSales,
      perm_handle_tickets: isSupport,
      perm_view_reports: false
    }));
  };

  const handleGenerateStaffCode = () => {
    const code = `STF-${Math.floor(100 + Math.random() * 900)}`;
    setStaffForm((prev) => ({ ...prev, staff_code: code }));
  };

  const handleOpenEditStaff = (stf) => {
    setEditingStaffId(stf.id);
    setStaffForm({
      staff_code: stf.staff_code || '',
      full_name: stf.full_name || '',
      email: stf.email || '',
      phone: stf.phone || '',
      department: stf.department || 'Warehouse',
      status: stf.status || 'active',
      perm_manage_stock: Boolean(stf.perm_manage_stock),
      perm_process_orders: Boolean(stf.perm_process_orders),
      perm_handle_tickets: Boolean(stf.perm_handle_tickets),
      perm_view_reports: Boolean(stf.perm_view_reports)
    });
    setShowStaffForm(true);
  };

  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingStaffId ? `/api/staffs/${editingStaffId}` : '/api/staffs';
      const method = editingStaffId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffForm)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Lỗi lưu nhân viên');

      showToast(editingStaffId ? 'Đã cập nhật nhân viên!' : 'Đã thêm nhân viên mới!', 'success');
      setShowStaffForm(false);
      setEditingStaffId(null);
      fetchStaffs();
      onStaffUpdated?.();
    } catch (err) {
      showToast(err.message || 'Lỗi thao tác nhân viên', 'error');
    }
  };

  const handleDeleteStaff = async (id, name) => {
    if (!window.confirm(`Bạn có chắc muốn xóa nhân viên "${name}"?`)) return;
    try {
      const res = await fetch(`/api/staffs/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Lỗi xóa nhân viên');
      showToast('Đã xóa nhân viên thành công!', 'success');
      fetchStaffs();
      onStaffUpdated?.();
    } catch (err) {
      showToast(err.message || 'Lỗi xóa nhân viên', 'error');
    }
  };

  // Task submit
  const handleAssignTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskForm.assigned_to) {
      showToast('Vui lòng chọn nhân viên để giao việc!', 'warning');
      return;
    }
    try {
      const res = await fetch('/api/staffs/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskForm)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Lỗi giao việc');

      showToast('Đã giao nhiệm vụ thành công!', 'success');
      setTaskForm({
        title: '',
        assigned_to: '',
        priority: 'medium',
        description: '',
        due_date: ''
      });
      fetchTasks();
    } catch (err) {
      showToast(err.message || 'Lỗi giao nhiệm vụ', 'error');
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      const res = await fetch(`/api/staffs/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Lỗi cập nhật');

      showToast('Đã cập nhật trạng thái nhiệm vụ!', 'success');
      fetchTasks();
    } catch (err) {
      showToast(err.message || 'Lỗi cập nhật trạng thái', 'error');
    }
  };

  // Schedule submit
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!schedForm.staff_id) {
      showToast('Vui lòng chọn nhân viên!', 'warning');
      return;
    }
    try {
      const res = await fetch('/api/staffs/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schedForm)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Lỗi lưu ca trực');

      showToast('Đã xếp ca trực thành công!', 'success');
      fetchSchedules();
    } catch (err) {
      showToast(err.message || 'Lỗi lưu ca trực', 'error');
    }
  };

  const handleDeleteSchedule = async (id) => {
    try {
      const res = await fetch(`/api/staffs/schedules/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Lỗi xóa ca trực');

      showToast('Đã xóa ca trực!', 'success');
      fetchSchedules();
    } catch (err) {
      showToast(err.message || 'Lỗi xóa ca trực', 'error');
    }
  };

  const filteredStaffs = staffs.filter((s) => {
    const matchSearch =
      (s.full_name || '').toLowerCase().includes(staffSearch.toLowerCase()) ||
      (s.staff_code || '').toLowerCase().includes(staffSearch.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(staffSearch.toLowerCase());
    const matchDept = staffDeptFilter === 'all' || s.department === staffDeptFilter;
    return matchSearch && matchDept;
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <UserCog className="w-6 h-6 text-cyan-400" />
            <span>Phân Quyền & Quản Lý Nhân Sự Cấp Dưới</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Phân chia quyền xử lý nghiệp vụ, giao việc theo tiến độ, xếp lịch ca trực và theo dõi KPI
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300">
            Tổng nhân sự: <span className="text-cyan-400 font-bold">{staffs.length}</span> người
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900/60 rounded-2xl border border-slate-800 overflow-x-auto text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'roles'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Phân Quyền Chức Vụ</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'tasks'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>Giao Việc (Assign Tasks)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('schedules')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'schedules'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Lịch Ca Trực (Schedules)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('performance')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'performance'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Hiệu Suất & KPI</span>
        </button>
      </div>

      {/* Tab 1: Roles & Permissions */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-900/60 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  placeholder="Tìm theo tên, mã NV, email..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <select
                value={staffDeptFilter}
                onChange={(e) => setStaffDeptFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                <option value="all">Tất cả chức vụ</option>
                <option value="Warehouse">Kho vận (Warehouse)</option>
                <option value="Sales">Bán hàng (Sales)</option>
                <option value="Customer Support">CSKH (Support)</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingStaffId(null);
                setStaffForm({
                  staff_code: '',
                  full_name: '',
                  email: '',
                  phone: '',
                  department: 'Warehouse',
                  status: 'active',
                  perm_manage_stock: true,
                  perm_process_orders: false,
                  perm_handle_tickets: false,
                  perm_view_reports: false
                });
                setShowStaffForm(true);
              }}
              className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-1.5 shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Thêm Nhân Viên Mới</span>
            </button>
          </div>

          {/* Staff Form Modal/Container */}
          {showStaffForm && (
            <div className="glass-card rounded-2xl border border-cyan-500/40 p-6 space-y-4 animate-scale-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-sm font-bold text-white">
                    {editingStaffId ? 'Chỉnh Sửa Nhân Viên & Phân Quyền' : 'Thêm Nhân Viên Cấp Dưới & Phân Quyền'}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowStaffForm(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleStaffSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Mã Nhân Viên <span className="text-rose-400">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={staffForm.staff_code}
                        onChange={(e) =>
                          setStaffForm((prev) => ({ ...prev, staff_code: e.target.value.toUpperCase() }))
                        }
                        placeholder="VD: STF-W01"
                        className="flex-1 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono uppercase focus:border-cyan-400"
                      />
                      <button
                        type="button"
                        onClick={handleGenerateStaffCode}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-xl border border-slate-700 text-xs"
                        title="Tự tạo mã"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Họ và Tên <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={staffForm.full_name}
                      onChange={(e) =>
                        setStaffForm((prev) => ({ ...prev, full_name: e.target.value }))
                      }
                      placeholder="VD: Trần Minh Tuấn"
                      className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Email Đăng Nhập <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={staffForm.email}
                      onChange={(e) =>
                        setStaffForm((prev) => ({ ...prev, email: e.target.value }))
                      }
                      placeholder="VD: tuan.tm@techshop.vn"
                      className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Số Điện Thoại
                    </label>
                    <input
                      type="text"
                      value={staffForm.phone}
                      onChange={(e) =>
                        setStaffForm((prev) => ({ ...prev, phone: e.target.value }))
                      }
                      placeholder="VD: 0912345671"
                      className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Chức Vụ / Phòng Ban <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={staffForm.department}
                      onChange={(e) => handleDeptChange(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-cyan-400 cursor-pointer"
                    >
                      <option value="Warehouse">📦 Kho vận (Warehouse) - Quản lý nhập/xuất kho</option>
                      <option value="Sales">🛒 Bán hàng (Sales) - Tiếp nhận & xử lý đơn hàng</option>
                      <option value="Customer Support">💬 CSKH (Customer Support) - Hỗ trợ kỹ thuật</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Trạng Thái Tài Khoản
                    </label>
                    <select
                      value={staffForm.status}
                      onChange={(e) =>
                        setStaffForm((prev) => ({ ...prev, status: e.target.value }))
                      }
                      className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-cyan-400 cursor-pointer"
                    >
                      <option value="active">Active (Đang hoạt động)</option>
                      <option value="inactive">Inactive (Tạm khóa quyền)</option>
                    </select>
                  </div>
                </div>

                {/* Permissions Matrix */}
                <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/80 space-y-3">
                  <span className="font-semibold text-slate-200 block">
                    Phân Chia Quyền Hạn Thực Thi:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex items-start gap-2.5 p-3 bg-slate-900/60 rounded-xl border border-slate-700/60 cursor-pointer hover:border-cyan-500/40 transition-colors">
                      <input
                        type="checkbox"
                        checked={staffForm.perm_manage_stock}
                        onChange={(e) =>
                          setStaffForm((p) => ({ ...p, perm_manage_stock: e.target.checked }))
                        }
                        className="mt-0.5 rounded text-cyan-500"
                      />
                      <div>
                        <div className="font-semibold text-slate-200">📦 Quản Lý Tồn Kho</div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Nhập/xuất kho, kiểm kê và điều chỉnh tồn kho.
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-3 bg-slate-900/60 rounded-xl border border-slate-700/60 cursor-pointer hover:border-cyan-500/40 transition-colors">
                      <input
                        type="checkbox"
                        checked={staffForm.perm_process_orders}
                        onChange={(e) =>
                          setStaffForm((p) => ({ ...p, perm_process_orders: e.target.checked }))
                        }
                        className="mt-0.5 rounded text-cyan-500"
                      />
                      <div>
                        <div className="font-semibold text-slate-200">🛒 Xử Lý Đơn Hàng</div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Tiếp nhận và cập nhật trạng thái giao đơn.
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-3 bg-slate-900/60 rounded-xl border border-slate-700/60 cursor-pointer hover:border-cyan-500/40 transition-colors">
                      <input
                        type="checkbox"
                        checked={staffForm.perm_handle_tickets}
                        onChange={(e) =>
                          setStaffForm((p) => ({ ...p, perm_handle_tickets: e.target.checked }))
                        }
                        className="mt-0.5 rounded text-cyan-500"
                      />
                      <div>
                        <div className="font-semibold text-slate-200">💬 Hỗ Trợ Khách Hàng</div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Giải đáp kỹ thuật và xử lý khiếu nại.
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-3 bg-slate-900/60 rounded-xl border border-slate-700/60 cursor-pointer hover:border-cyan-500/40 transition-colors">
                      <input
                        type="checkbox"
                        checked={staffForm.perm_view_reports}
                        onChange={(e) =>
                          setStaffForm((p) => ({ ...p, perm_view_reports: e.target.checked }))
                        }
                        className="mt-0.5 rounded text-cyan-500"
                      />
                      <div>
                        <div className="font-semibold text-slate-200">📊 Xem Báo Cáo Thống Kê</div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Xem biểu đồ tài chính và chỉ số KPI.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowStaffForm(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-600/30 flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Lưu Nhân Viên</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Staff Grid/List */}
          <div className="space-y-3">
            {loading ? (
              <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                <span>Đang tải danh sách nhân viên...</span>
              </div>
            ) : filteredStaffs.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center text-slate-400 text-xs border border-slate-800">
                Không tìm thấy nhân viên nào phù hợp.
              </div>
            ) : (
              filteredStaffs.map((stf) => (
                <div
                  key={stf.id}
                  className="glass-card rounded-2xl p-4 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-base">
                      {(stf.full_name || 'U')[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h4 className="font-bold text-slate-100 text-sm">{stf.full_name}</h4>
                        <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                          {stf.staff_code || 'N/A'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {stf.department}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                            stf.status === 'active'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                              : 'bg-rose-950 text-rose-300 border border-rose-800/50'
                          }`}
                        >
                          {stf.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{stf.email} • {stf.phone || 'Chưa có SĐT'}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {stf.perm_manage_stock ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-emerald-500/20">
                            ✓ Quản lý kho
                          </span>
                        ) : null}
                        {stf.perm_process_orders ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-cyan-500/20">
                            ✓ Đơn hàng
                          </span>
                        ) : null}
                        {stf.perm_handle_tickets ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-violet-400 border border-violet-500/20">
                            ✓ Hỗ trợ CSKH
                          </span>
                        ) : null}
                        {stf.perm_view_reports ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-amber-500/20">
                            ✓ Xem báo cáo
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleOpenEditStaff(stf)}
                      className="px-3 py-1.5 text-xs rounded-xl bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-400 border border-slate-700 transition-all flex items-center gap-1.5"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Sửa</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteStaff(stf.id, stf.full_name)}
                      className="px-3 py-1.5 text-xs rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Tasks */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-5 border border-cyan-500/30 space-y-4">
            <h4 className="text-xs font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <ClipboardCheck className="w-4 h-4 text-cyan-400" />
              <span>Giao Nhiệm Vụ Mới Cho Nhân Viên</span>
            </h4>

            <form onSubmit={handleAssignTaskSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-medium mb-1.5">
                  Tiêu đề nhiệm vụ <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={taskForm.title}
                  onChange={(e) => setTaskForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="VD: Kiểm kê màn hình Gaming, Hỗ trợ đổi trả khách VIP..."
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Giao cho nhân viên <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  value={taskForm.assigned_to}
                  onChange={(e) => setTaskForm((p) => ({ ...p, assigned_to: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-cyan-400 cursor-pointer"
                >
                  <option value="">-- Chọn nhân viên --</option>
                  {staffs.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Mức độ ưu tiên</label>
                <select
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm((p) => ({ ...p, priority: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-cyan-400 cursor-pointer"
                >
                  <option value="medium">Bình thường (Medium)</option>
                  <option value="high">Ưu tiên cao (High)</option>
                  <option value="urgent">Khẩn cấp (Urgent)</option>
                  <option value="low">Thấp (Low)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-medium mb-1.5">Chi tiết công việc / Hướng dẫn</label>
                <input
                  type="text"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Mô tả các yêu cầu cụ thể..."
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Hạn hoàn thành (Deadline)</label>
                <input
                  type="date"
                  value={taskForm.due_date}
                  onChange={(e) => setTaskForm((p) => ({ ...p, due_date: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-cyan-400"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-cyan-600/20 flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Giao Việc Ngay</span>
                </button>
              </div>
            </form>
          </div>

          {/* Tasks List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="font-bold text-slate-200">Danh Sách Nhiệm Vụ Đã Phân Bổ</span>
              <select
                value={taskFilterStatus}
                onChange={(e) => setTaskFilterStatus(e.target.value)}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 focus:border-cyan-400"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="todo">Chưa thực hiện (Todo)</option>
                <option value="in_progress">Đang thực hiện (In Progress)</option>
                <option value="completed">Đã hoàn thành (Completed)</option>
              </select>
            </div>

            {tasks
              .filter((t) => taskFilterStatus === 'all' || t.status === taskFilterStatus)
              .map((t) => (
                <div
                  key={t.id}
                  className="glass-card rounded-2xl p-4 border border-slate-800 flex items-center justify-between gap-4 text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-200 flex items-center gap-2">
                      <span className="text-sm">{t.title}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                          t.priority === 'urgent'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800/50'
                            : t.priority === 'high'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800/50'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Giao cho: <span className="text-slate-300 font-medium">{t.assigned_to_name || 'Nhân viên'}</span> • Hạn:{' '}
                      {t.due_date ? new Date(t.due_date).toLocaleDateString('vi-VN') : 'Không có'}
                    </p>
                    {t.description && <p className="text-[11px] text-slate-500 mt-1">{t.description}</p>}
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={t.status}
                      onChange={(e) => handleUpdateTaskStatus(t.id, e.target.value)}
                      className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white cursor-pointer"
                    >
                      <option value="todo">Chưa làm</option>
                      <option value="in_progress">Đang làm</option>
                      <option value="completed">Hoàn thành</option>
                    </select>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Tab 3: Schedules */}
      {activeTab === 'schedules' && (
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <CalendarPlus className="w-4 h-4 text-emerald-400" />
              <span>Xếp Lịch Ca Trực Nhân Viên</span>
            </h4>

            <form onSubmit={handleScheduleSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Nhân viên <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  value={schedForm.staff_id}
                  onChange={(e) => setSchedForm((p) => ({ ...p, staff_id: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-cyan-400 cursor-pointer"
                >
                  <option value="">-- Chọn nhân viên --</option>
                  {staffs.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Ngày làm việc <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={schedForm.shift_date}
                  onChange={(e) => setSchedForm((p) => ({ ...p, shift_date: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Ca làm việc <span className="text-rose-400">*</span>
                </label>
                <select
                  value={schedForm.shift_name}
                  onChange={(e) => setSchedForm((p) => ({ ...p, shift_name: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-cyan-400 cursor-pointer"
                >
                  <option value="morning">Ca Sáng (08:00 - 12:00)</option>
                  <option value="afternoon">Ca Chiều (13:00 - 17:00)</option>
                  <option value="evening">Ca Tối (18:00 - 22:00)</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Lưu Ca Trực</span>
                </button>
              </div>
            </form>
          </div>

          {/* Schedule list */}
          <div className="space-y-3 text-xs">
            <span className="font-bold text-slate-200">Lịch Phân Ca Đang Áp Dụng</span>
            {schedules.length === 0 ? (
              <div className="glass-card rounded-2xl p-8 text-center text-slate-400">
                Chưa có lịch ca trực nào được phân bổ.
              </div>
            ) : (
              schedules.map((sc) => (
                <div
                  key={sc.id}
                  className="glass-card rounded-2xl p-4 border border-slate-800 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-100 text-sm">{sc.staff_name || 'Nhân viên'}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {sc.shift_date ? new Date(sc.shift_date).toLocaleDateString('vi-VN') : ''} • Ca:{' '}
                        {sc.shift_name === 'morning'
                          ? 'Sáng (08:00 - 12:00)'
                          : sc.shift_name === 'afternoon'
                          ? 'Chiều (13:00 - 17:00)'
                          : 'Tối (18:00 - 22:00)'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteSchedule(sc.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Xóa ca trực"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Performance */}
      {activeTab === 'performance' && (
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-white text-sm">Bảng Đánh Giá Hiệu Suất & KPI Nhân Sự</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Tính toán tỷ lệ hoàn thành nhiệm vụ và chỉ số KPI tự động
              </p>
            </div>
            <button
              type="button"
              onClick={fetchPerformance}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Làm mới KPI</span>
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {performance.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center text-slate-400">
                Chưa có đủ dữ liệu hiệu suất nhân sự.
              </div>
            ) : (
              performance.map((p, idx) => (
                <div
                  key={idx}
                  className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="font-semibold text-slate-100 text-sm flex items-center gap-2">
                      <span>{p.full_name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                        {p.department}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Tổng việc: {p.total_tasks || 0} • Hoàn thành: {p.completed_tasks || 0} • Đang làm:{' '}
                      {p.in_progress_tasks || 0}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-lg text-cyan-400 font-mono">
                      {p.completion_rate ?? 100}%
                    </div>
                    <div className="text-[10px] text-slate-500">Tỷ lệ hoàn thành nhiệm vụ</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
