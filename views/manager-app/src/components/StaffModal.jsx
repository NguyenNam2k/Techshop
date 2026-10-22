import React, { useState, useEffect } from 'react';
import {
  UserCog,
  X,
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
  CheckCircle2
} from 'lucide-react';
import { showToast } from './Toast';

export default function StaffModal({ isOpen, onClose, onStaffUpdated }) {
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
    if (isOpen) {
      fetchStaffs();
      if (activeTab === 'tasks') fetchTasks();
      if (activeTab === 'schedules') fetchSchedules();
      if (activeTab === 'performance') fetchPerformance();
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  // Auto assign default perms on department select
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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-card rounded-2xl w-full max-w-4xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-scale-in">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <UserCog className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Phân Quyền & Chức Vụ Nhân Viên Cấp Dưới</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Manager Control
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Phân chia quyền xử lý kho, đơn hàng, phản hồi khách hàng và báo cáo cho nhân viên
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

        {/* Tab Navigation */}
        <div className="px-5 py-2.5 border-b border-slate-800 bg-slate-950/40 flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('roles')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'roles'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Phân Quyền Chức Vụ</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tasks')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'tasks'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Giao Việc (Assign Tasks)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('schedules')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'schedules'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Lịch Ca Trực (Schedules)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('performance')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'performance'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Hiệu Suất (Performance)</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
          {/* TAB 1: ROLES & PERMISSIONS */}
          {activeTab === 'roles' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={staffSearch}
                      onChange={(e) => setStaffSearch(e.target.value)}
                      placeholder="Tìm theo tên, mã NV, email..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <select
                    value={staffDeptFilter}
                    onChange={(e) => setStaffDeptFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
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
                  className="w-full sm:w-auto px-3.5 py-1.5 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 font-bold text-xs rounded-lg shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-1.5 shrink-0"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Thêm Nhân Viên Mới</span>
                </button>
              </div>

              {/* Staff Form */}
              {showStaffForm && (
                <div className="bg-slate-900/80 rounded-xl border border-cyan-500/40 p-4 space-y-4 mb-4 animate-scale-in">
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
                      className="text-slate-400 hover:text-white text-xs flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Đóng form</span>
                    </button>
                  </div>

                  <form onSubmit={handleStaffSubmit} className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">
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
                            className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono uppercase focus:border-cyan-400"
                          />
                          <button
                            type="button"
                            onClick={handleGenerateStaffCode}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg border border-slate-700 text-[11px]"
                            title="Tự tạo mã"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">
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
                          className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-cyan-400"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">
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
                          className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-cyan-400"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">
                          Số Điện Thoại
                        </label>
                        <input
                          type="text"
                          value={staffForm.phone}
                          onChange={(e) =>
                            setStaffForm((prev) => ({ ...prev, phone: e.target.value }))
                          }
                          placeholder="VD: 0912345671"
                          className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:border-cyan-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">
                          Chức Vụ / Phòng Ban <span className="text-rose-400">*</span>
                        </label>
                        <select
                          value={staffForm.department}
                          onChange={(e) => handleDeptChange(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-cyan-400 cursor-pointer"
                        >
                          <option value="Warehouse">📦 Kho vận (Warehouse) - Quản lý nhập/xuất kho</option>
                          <option value="Sales">🛒 Bán hàng (Sales) - Tiếp nhận & xử lý đơn hàng</option>
                          <option value="Customer Support">💬 CSKH (Customer Support) - Hỗ trợ kỹ thuật</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">
                          Trạng Thái Tài Khoản
                        </label>
                        <select
                          value={staffForm.status}
                          onChange={(e) =>
                            setStaffForm((prev) => ({ ...prev, status: e.target.value }))
                          }
                          className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-cyan-400 cursor-pointer"
                        >
                          <option value="active">Active (Đang hoạt động & được phép thao tác)</option>
                          <option value="inactive">Inactive (Tạm khóa quyền truy cập)</option>
                        </select>
                      </div>
                    </div>

                    {/* Permissions Matrix */}
                    <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/80 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200">Phân Chia Quyền Xử Lý Nghiệp Vụ:</span>
                        <span className="text-[10px] text-cyan-400 font-mono">Quyền hạn thực thi</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        <label className="flex items-start gap-2.5 p-2 bg-slate-900/60 rounded-lg border border-slate-700/60 cursor-pointer hover:border-cyan-500/40 transition-colors">
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
                              Nhập/xuất kho, kiểm kê số lượng và điều chỉnh tồn kho.
                            </p>
                          </div>
                        </label>

                        <label className="flex items-start gap-2.5 p-2 bg-slate-900/60 rounded-lg border border-slate-700/60 cursor-pointer hover:border-cyan-500/40 transition-colors">
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
                              Tiếp nhận, xác nhận đơn hàng và cập nhật giao vận.
                            </p>
                          </div>
                        </label>

                        <label className="flex items-start gap-2.5 p-2 bg-slate-900/60 rounded-lg border border-slate-700/60 cursor-pointer hover:border-cyan-500/40 transition-colors">
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
                              Tiếp nhận ticket, giải đáp kỹ thuật và phản hồi đánh giá.
                            </p>
                          </div>
                        </label>

                        <label className="flex items-start gap-2.5 p-2 bg-slate-900/60 rounded-lg border border-slate-700/60 cursor-pointer hover:border-cyan-500/40 transition-colors">
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
                              Xem thống kê tổng quan doanh thu, tồn kho và các chỉ số KPI.
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setShowStaffForm(false)}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                      >
                        Hủy bỏ
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-600/30 flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Lưu Phân Quyền Nhân Viên</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Staff List */}
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-8 text-slate-400 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                    <span>Đang tải danh sách nhân viên cấp dưới...</span>
                  </div>
                ) : filteredStaffs.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    Không tìm thấy nhân viên nào phù hợp.
                  </div>
                ) : (
                  filteredStaffs.map((stf) => (
                    <div
                      key={stf.id}
                      className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-sm">
                          {(stf.full_name || 'U')[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-slate-200">{stf.full_name}</h4>
                            <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
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
                          <p className="text-xs text-slate-400 mt-0.5">{stf.email} • {stf.phone || 'Chưa có SĐT'}</p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            {stf.perm_manage_stock ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 border border-emerald-500/20">
                                ✓ Quản lý kho
                              </span>
                            ) : null}
                            {stf.perm_process_orders ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 border border-cyan-500/20">
                                ✓ Đơn hàng
                              </span>
                            ) : null}
                            {stf.perm_handle_tickets ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-violet-400 border border-violet-500/20">
                                ✓ Hỗ trợ CSKH
                              </span>
                            ) : null}
                            {stf.perm_view_reports ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 border border-amber-500/20">
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
                          className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-400 border border-slate-700 transition-all flex items-center gap-1"
                          title="Sửa thông tin & quyền"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Sửa</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteStaff(stf.id, stf.full_name)}
                          className="px-2.5 py-1 text-xs rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all flex items-center gap-1"
                          title="Xóa nhân viên"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: TASKS ASSIGNMENT */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-900/80 rounded-xl border border-cyan-500/30 space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                  <ClipboardCheck className="w-4 h-4 text-cyan-400" />
                  <span>Giao Nhiệm Vụ Mới Cho Nhân Viên</span>
                </h4>

                <form onSubmit={handleAssignTaskSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 font-medium mb-1">
                      Tiêu đề nhiệm vụ <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={taskForm.title}
                      onChange={(e) => setTaskForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder="VD: Kiểm kê màn hình Gaming, Tư vấn khách VIP..."
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Giao cho nhân viên <span className="text-rose-400">*</span>
                    </label>
                    <select
                      required
                      value={taskForm.assigned_to}
                      onChange={(e) => setTaskForm((p) => ({ ...p, assigned_to: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-cyan-400 cursor-pointer"
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
                    <label className="block text-slate-300 font-medium mb-1">Mức độ ưu tiên</label>
                    <select
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm((p) => ({ ...p, priority: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-cyan-400 cursor-pointer"
                    >
                      <option value="medium">Bình thường (Medium)</option>
                      <option value="high">Ưu tiên cao (High)</option>
                      <option value="urgent">Khẩn cấp (Urgent)</option>
                      <option value="low">Thấp (Low)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 font-medium mb-1">Chi tiết công việc / Hướng dẫn</label>
                    <input
                      type="text"
                      value={taskForm.description}
                      onChange={(e) => setTaskForm((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Mô tả các yêu cầu cụ thể..."
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Hạn hoàn thành (Deadline)</label>
                    <input
                      type="date"
                      value={taskForm.due_date}
                      onChange={(e) => setTaskForm((p) => ({ ...p, due_date: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-cyan-400"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-1.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg shadow-lg shadow-cyan-600/20 flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Giao Việc</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Tasks List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="font-bold text-slate-200">Danh Sách Nhiệm Vụ Đã Giao</span>
                  <select
                    value={taskFilterStatus}
                    onChange={(e) => setTaskFilterStatus(e.target.value)}
                    className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 focus:border-cyan-400"
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
                      className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-semibold text-slate-200 flex items-center gap-2">
                          <span>{t.title}</span>
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
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Giao cho: <span className="text-slate-300 font-medium">{t.assigned_to_name || 'Nhân viên'}</span> • Hạn:{' '}
                          {t.due_date ? new Date(t.due_date).toLocaleDateString('vi-VN') : 'Không có'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={t.status}
                          onChange={(e) => handleUpdateTaskStatus(t.id, e.target.value)}
                          className="px-2.5 py-1 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white cursor-pointer"
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

          {/* TAB 3: SCHEDULES */}
          {activeTab === 'schedules' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                  <CalendarPlus className="w-4 h-4 text-emerald-400" />
                  <span>Xếp Lịch Ca Trực Nhân Viên</span>
                </h4>

                <form onSubmit={handleScheduleSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Nhân viên <span className="text-rose-400">*</span>
                    </label>
                    <select
                      required
                      value={schedForm.staff_id}
                      onChange={(e) => setSchedForm((p) => ({ ...p, staff_id: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-cyan-400 cursor-pointer"
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
                    <label className="block text-slate-300 font-medium mb-1">
                      Ngày làm việc <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={schedForm.shift_date}
                      onChange={(e) => setSchedForm((p) => ({ ...p, shift_date: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Ca làm việc <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={schedForm.shift_name}
                      onChange={(e) => setSchedForm((p) => ({ ...p, shift_name: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-cyan-400 cursor-pointer"
                    >
                      <option value="morning">Ca Sáng (08:00 - 12:00)</option>
                      <option value="afternoon">Ca Chiều (13:00 - 17:00)</option>
                      <option value="evening">Ca Tối (18:00 - 22:00)</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-1.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Lưu Ca Trực</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Schedule list */}
              <div className="space-y-2 text-xs">
                <span className="font-bold text-slate-200">Lịch Làm Việc Phân Ca</span>
                {schedules.length === 0 ? (
                  <div className="text-center py-6 text-slate-400">Chưa có lịch ca trực nào được phân bổ.</div>
                ) : (
                  schedules.map((sc) => (
                    <div
                      key={sc.id}
                      className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-200">{sc.staff_name || 'Nhân viên'}</div>
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
                        className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Xóa ca trực"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: PERFORMANCE */}
          {activeTab === 'performance' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">Bảng Đánh Giá Hiệu Suất & KPI Nhân Sự</h4>
                  <p className="text-xs text-slate-400">Tính toán tỷ lệ hoàn thành nhiệm vụ và chỉ số KPI tự động</p>
                </div>
                <button
                  type="button"
                  onClick={fetchPerformance}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Làm mới KPI</span>
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {performance.length === 0 ? (
                  <div className="text-center py-6 text-slate-400">Chưa có đủ dữ liệu hiệu suất nhân sự.</div>
                ) : (
                  performance.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-semibold text-slate-200 text-sm flex items-center gap-2">
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
                        <div className="font-bold text-base text-cyan-400 font-mono">
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
      </div>
    </div>
  );
}
