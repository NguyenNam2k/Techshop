import React, { useState, useEffect } from 'react';
import {
  TicketPercent,
  X,
  Search,
  Plus,
  Tag,
  Check,
  CheckCircle,
  XCircle,
  Trash2,
  Power,
  Loader2
} from 'lucide-react';
import { showToast } from './Toast';

export default function CouponModal({ isOpen, onClose }) {
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
    if (isOpen) {
      fetchCoupons();
    }
  }, [isOpen, searchTerm, filterActive]);

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-card rounded-2xl w-full max-w-4xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-scale-in">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <TicketPercent className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Quản Lý Mã Giảm Giá & Khuyến Mãi (Coupons)
              </h3>
              <p className="text-xs text-slate-400">
                Thiết lập chiết khấu, hạn mức đơn hàng và thời gian áp dụng mã
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

        {/* Action bar */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo mã code, mô tả..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="1">Đang kích hoạt</option>
              <option value="0">Ngừng kích hoạt</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="w-full sm:w-auto px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-lg shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 shrink-0"
          >
            {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{showForm ? 'Đóng form' : 'Thêm Mã Mới'}</span>
          </button>
        </div>

        {/* Modal content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
          {/* Coupon Form */}
          {showForm && (
            <div className="bg-slate-900/90 rounded-xl border border-amber-500/40 p-4 space-y-3 mb-4 animate-scale-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-amber-400" />
                  <span>Khởi Tạo Mã Giảm Giá Mới</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
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
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono font-bold focus:border-amber-400 uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Loại giảm giá</label>
                    <select
                      value={formData.discount_type}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, discount_type: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-amber-400 cursor-pointer"
                    >
                      <option value="percentage">Phần trăm (%)</option>
                      <option value="fixed">Số tiền cố định (VNĐ)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
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
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
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
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
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
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Giới hạn số lượt dùng
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.usage_limit}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, usage_limit: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Ngày bắt đầu <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.start_date}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, start_date: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Ngày kết thúc <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.end_date}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, end_date: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Mô tả chương trình khuyến mãi
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Mô tả áp dụng cho khách hàng..."
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>Lưu Mã Giảm Giá</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Coupons List */}
          {loading ? (
            <div className="text-center py-12 text-slate-400 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
              <span>Đang tải danh sách mã giảm giá...</span>
            </div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              Chưa có mã giảm giá nào phù hợp.
            </div>
          ) : (
            coupons.map((c) => {
              const isActive = Boolean(c.is_active);
              return (
                <div
                  key={c.id}
                  className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                      <Tag className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-amber-400">
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
                        <span className="text-[11px] text-slate-400 font-mono">
                          {c.discount_type === 'percentage'
                            ? `Giảm ${c.discount_value}%`
                            : `Giảm ${Number(c.discount_value).toLocaleString('vi-VN')} ₫`}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{c.description || 'Chương trình khuyến mãi'}</p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono mt-1">
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
                      className={`px-2.5 py-1 text-xs rounded-lg border transition-all flex items-center gap-1 ${
                        isActive
                          ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      }`}
                      title={isActive ? 'Tạm dừng mã' : 'Kích hoạt mã'}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{isActive ? 'Dừng' : 'Bật'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteCoupon(c.id, c.code)}
                      className="px-2.5 py-1 text-xs rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all flex items-center gap-1"
                      title="Xóa mã"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
