import React, { useState, useEffect } from 'react';
import {
  TicketPercent,
  Plus,
  Search,
  Tag,
  Check,
  CheckCircle,
  XCircle,
  Trash2,
  Power,
  Loader2,
  X
} from 'lucide-react';
import { showToast } from '../components/Toast';

export default function CouponsView() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_order_value: 0,
    max_discount_amount: '',
    usage_limit: 100,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    description: ''
  });

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      let url = '/api/coupons?';
      if (searchTerm) url += `search=${encodeURIComponent(searchTerm)}&`;
      if (filterActive !== 'all') url += `is_active=${filterActive}&`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setCoupons(data.data || []);
      }
    } catch (err) {
      showToast('Không thể tải danh sách mã giảm giá', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [searchTerm, filterActive]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      showToast('Vui lòng nhập mã code!', 'warning');
      return;
    }
    if (!formData.discount_value) {
      showToast('Vui lòng nhập giá trị giảm!', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        discount_type: formData.discount_type,
        discount_value: Number(formData.discount_value),
        min_order_value: Number(formData.min_order_value || 0),
        max_discount_amount: formData.max_discount_amount ? Number(formData.max_discount_amount) : null,
        usage_limit: Number(formData.usage_limit || 100),
        start_date: formData.start_date,
        end_date: formData.end_date,
        description: formData.description.trim()
      };

      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Lỗi tạo mã giảm giá');

      showToast(`Đã tạo mã giảm giá ${payload.code}!`, 'success');
      setShowForm(false);
      setFormData({
        code: '',
        discount_type: 'percentage',
        discount_value: '',
        min_order_value: 0,
        max_discount_amount: '',
        usage_limit: 100,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        description: ''
      });
      fetchCoupons();
    } catch (err) {
      showToast(err.message || 'Lỗi tạo mã', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await fetch(`/api/coupons/${id}/toggle`, {
        method: 'PATCH'
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Lỗi thay đổi trạng thái');

      showToast('Đã cập nhật trạng thái mã!', 'success');
      fetchCoupons();
    } catch (err) {
      showToast(err.message || 'Không thể đổi trạng thái', 'error');
    }
  };

  const handleDeleteCoupon = async (id, code) => {
    if (!window.confirm(`Bạn có chắc muốn xóa vĩnh viễn mã "${code}"?`)) return;

    try {
      const res = await fetch(`/api/coupons/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Lỗi xóa mã');

      showToast(`Đã xóa mã ${code}!`, 'success');
      fetchCoupons();
    } catch (err) {
      showToast(err.message || 'Lỗi xóa mã', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <TicketPercent className="w-6 h-6 text-amber-400" />
            <span>Quản Lý Mã Giảm Giá & Khuyến Mãi (Coupons)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Thiết lập chiết khấu đơn hàng, giới hạn ngân sách và chiến dịch khuyến mãi cho khách hàng
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{showForm ? 'Đóng Biểu Mẫu' : 'Thêm Mã Mới'}</span>
        </button>
      </div>

      {/* Creation Form (Collapsible) */}
      {showForm && (
        <div className="glass-card rounded-2xl border border-amber-500/40 p-6 space-y-4 animate-scale-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Tag className="w-4 h-4 text-amber-400" />
              <span>Khởi Tạo Chiến Dịch Mã Giảm Giá Mới</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Mã Code (Chữ in hoa) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                  }
                  placeholder="VD: TECH10, VIP500K"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono font-bold focus:border-amber-400 uppercase"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Loại giảm giá</label>
                <select
                  value={formData.discount_type}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, discount_type: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-amber-400 cursor-pointer"
                >
                  <option value="percentage">Phần trăm (%)</option>
                  <option value="fixed">Số tiền cố định (VNĐ)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Giá trị giảm <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={formData.discount_value}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, discount_value: e.target.value }))
                  }
                  placeholder="VD: 10 (%) hoặc 500000"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-amber-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Đơn hàng tối thiểu (VNĐ)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.min_order_value}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, min_order_value: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Giảm tối đa (Nếu là %)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.max_discount_amount}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, max_discount_amount: e.target.value }))
                  }
                  placeholder="Để trống nếu không giới hạn"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Giới hạn số lượt dùng
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.usage_limit}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, usage_limit: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-amber-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Ngày bắt đầu <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, start_date: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Ngày kết thúc <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, end_date: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Mô tả chương trình khuyến mãi
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Mô tả áp dụng cho khách hàng..."
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-amber-400"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
              >
                Hủy Bỏ
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Lưu Mã Giảm Giá</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-900/60 rounded-2xl border border-slate-800">
        <div className="relative flex-1 sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã code, mô tả..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value)}
          className="px-3.5 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400 cursor-pointer"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="1">Đang kích hoạt</option>
          <option value="0">Ngừng kích hoạt</option>
        </select>
      </div>

      {/* Coupons List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
            <span>Đang tải danh sách mã giảm giá...</span>
          </div>
        ) : coupons.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center text-slate-400 text-xs border border-slate-800">
            Chưa có mã giảm giá nào phù hợp với bộ lọc.
          </div>
        ) : (
          coupons.map((c) => {
            const isActive = Boolean(c.is_active);
            return (
              <div
                key={c.id}
                className="glass-card rounded-2xl p-4 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                    <Tag className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono font-bold text-base text-amber-400 tracking-wider">
                        {c.code}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 ${
                          isActive
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                            : 'bg-rose-950 text-rose-300 border border-rose-800/50'
                        }`}
                      >
                        {isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span>{isActive ? 'Hoạt động' : 'Tạm dừng'}</span>
                      </span>
                      <span className="text-xs text-slate-300 font-mono font-semibold">
                        {c.discount_type === 'percentage'
                          ? `Giảm ${c.discount_value}%`
                          : `Giảm ${Number(c.discount_value).toLocaleString('vi-VN')} ₫`}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 mt-1">{c.description || 'Chương trình khuyến mãi'}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono mt-1.5 flex-wrap">
                      <span>Đơn tối thiểu: {Number(c.min_order_value || 0).toLocaleString('vi-VN')} ₫</span>
                      <span>•</span>
                      <span>Đã dùng: {c.used_count ?? 0}/{c.usage_limit ?? '∞'}</span>
                      <span>•</span>
                      <span>Hạn: {c.end_date ? new Date(c.end_date).toLocaleDateString('vi-VN') : 'Vô thời hạn'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(c.id)}
                    className={`px-3 py-1.5 text-xs rounded-xl border transition-all flex items-center gap-1.5 font-semibold ${
                      isActive
                        ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    }`}
                    title={isActive ? 'Tạm dừng mã' : 'Kích hoạt mã'}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{isActive ? 'Tạm Dừng' : 'Kích Hoạt'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteCoupon(c.id, c.code)}
                    className="px-3 py-1.5 text-xs rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all flex items-center gap-1.5 font-semibold"
                    title="Xóa mã"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
