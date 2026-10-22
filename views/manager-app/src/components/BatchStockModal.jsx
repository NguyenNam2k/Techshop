import React, { useState, useEffect } from 'react';
import { Boxes, X, Check, Loader2 } from 'lucide-react';
import { showToast } from './Toast';

export default function BatchStockModal({
  isOpen,
  products = [],
  initialTarget = null,
  onClose,
  onSuccess
}) {
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [quantityChange, setQuantityChange] = useState('');
  const [newStock, setNewStock] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialTarget) {
      setSelectedVariantId(initialTarget.variant_id || '');
    } else if (products.length > 0 && !selectedVariantId) {
      setSelectedVariantId(products[0].default_variant_id || products[0].id);
    }
  }, [initialTarget, products]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVariantId) {
      showToast('Vui lòng chọn biến thể thiết bị', 'warning');
      return;
    }

    if (quantityChange === '' && newStock === '') {
      showToast('Vui lòng nhập Số lượng thay đổi hoặc Thiết lập tồn mới', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        items: [
          {
            variant_id: Number(selectedVariantId),
            ...(quantityChange !== '' ? { quantity_change: Number(quantityChange) } : {}),
            ...(newStock !== '' ? { new_stock: Number(newStock) } : {})
          }
        ],
        note: note.trim() || 'Điều chỉnh tồn kho từ Manager Portal'
      };

      const res = await fetch('/api/products/batch-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Lỗi cập nhật tồn kho');

      showToast('Cập nhật tồn kho thành công!', 'success');
      onSuccess?.();
      onClose();
    } catch (err) {
      showToast(err.message || 'Lỗi điều chỉnh tồn kho', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-card rounded-2xl w-full max-w-xl border border-slate-800 overflow-hidden shadow-2xl animate-scale-in">
        <div className="p-5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Điều Chỉnh Kho Hàng Loạt</h3>
              <p className="text-xs text-slate-400">
                Cập nhật số lượng nhập kho hoặc điều chỉnh tồn kho cho thiết bị
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Chọn biến thể thiết bị cần nhập / xuất kho:
            </label>
            <select
              value={selectedVariantId}
              onChange={(e) => setSelectedVariantId(e.target.value)}
              required
              className="w-full px-3.5 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white cursor-pointer focus:outline-none focus:border-violet-500"
            >
              {products.map((p) => {
                const varId = p.default_variant_id || p.id;
                return (
                  <option key={varId} value={varId}>
                    [{p.sku_code || 'N/A'}] {p.name} (Hiện có: {p.total_stock ?? 0})
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Số lượng thay đổi (+/-)
              </label>
              <input
                type="number"
                value={quantityChange}
                onChange={(e) => {
                  setQuantityChange(e.target.value);
                  if (e.target.value !== '') setNewStock('');
                }}
                placeholder="+20 hoặc -5"
                className="w-full px-3.5 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-violet-500"
              />
              <span className="text-[10px] text-slate-400">
                Dương (+) để nhập thêm, Âm (-) để trừ kho
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Hoặc Thiết lập số tồn mới
              </label>
              <input
                type="number"
                value={newStock}
                onChange={(e) => {
                  setNewStock(e.target.value);
                  if (e.target.value !== '') setQuantityChange('');
                }}
                min="0"
                placeholder="VD: 100"
                className="w-full px-3.5 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-violet-500"
              />
              <span className="text-[10px] text-slate-400">Ghi đè trực tiếp tồn kho mới</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Ghi chú điều chỉnh
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Nhập thêm lô hàng tháng 10 / Kiểm kê thực tế kho..."
              className="w-full px-3.5 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-violet-600/30 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>Xác Nhận Cập Nhật Kho</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
