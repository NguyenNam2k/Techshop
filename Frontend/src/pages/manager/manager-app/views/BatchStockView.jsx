import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Check,
  Loader2,
  RefreshCw,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  PackageCheck,
  Search
} from 'lucide-react';
import { showToast } from '../components/Toast';

export default function BatchStockView({
  products = [],
  initialTarget = null,
  onSuccess
}) {
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [quantityChange, setQuantityChange] = useState('');
  const [newStock, setNewStock] = useState('');
  const [note, setNote] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialTarget) {
      setSelectedVariantId(initialTarget.variant_id || '');
    } else if (products.length > 0 && !selectedVariantId) {
      setSelectedVariantId(products[0].default_variant_id || products[0].id);
    }
  }, [initialTarget, products]);

  const selectedProduct = products.find(
    (p) => (p.default_variant_id || p.id) == selectedVariantId
  );

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
      setQuantityChange('');
      setNewStock('');
      setNote('');
      onSuccess?.();
    } catch (err) {
      showToast(err.message || 'Lỗi điều chỉnh tồn kho', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.brand || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Boxes className="w-6 h-6 text-violet-400" />
            <span>Nhập Kho Hàng Loạt & Điều Chỉnh Tồn Kho</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cập nhật biến động số lượng tồn kho theo lô hàng, kiểm kê định kỳ và đối soát thực tế
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Adjustment Form Card */}
        <div className="lg:col-span-7 glass-card rounded-2xl p-6 border border-slate-800 space-y-5">
          <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-violet-400" />
            <span>Biểu Mẫu Điều Chỉnh Tồn Kho</span>
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Chọn biến thể thiết bị cần điều chỉnh <span className="text-rose-400">*</span>
              </label>
              <select
                value={selectedVariantId}
                onChange={(e) => setSelectedVariantId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white cursor-pointer focus:outline-none focus:border-violet-500"
              >
                {products.map((p) => {
                  const varId = p.default_variant_id || p.id;
                  return (
                    <option key={varId} value={varId}>
                      [{p.sku_code || 'N/A'}] {p.name} (Tồn hiện có: {p.total_stock ?? 0})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Số lượng thay đổi (+ / -)
                </label>
                <input
                  type="number"
                  value={quantityChange}
                  onChange={(e) => {
                    setQuantityChange(e.target.value);
                    if (e.target.value !== '') setNewStock('');
                  }}
                  placeholder="+20 hoặc -5"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-violet-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Dương (+) để nhập thêm, Âm (-) để trừ bớt
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
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
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-violet-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Ghi đè số lượng tồn kho mới trực tiếp
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Ghi chú điều chỉnh / Lý do nhập xuất
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="VD: Nhập thêm lô hàng tháng 10 / Kiểm kê thực tế kho..."
                className="w-full px-3.5 py-2.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-violet-600/30 disabled:opacity-50 transition-all"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>Xác Nhận Cập Nhật Tồn Kho</span>
              </button>
            </div>
          </form>
        </div>

        {/* Selected Product Preview Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-cyan-400" />
              <span>Thiết Bị Đang Được Chọn</span>
            </h3>

            {selectedProduct ? (
              <div className="space-y-4 text-xs">
                <div className="flex items-center gap-3.5">
                  <div className="w-16 h-16 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 shadow">
                    {selectedProduct.thumbnail_url ? (
                      <img
                        src={selectedProduct.thumbnail_url}
                        alt={selectedProduct.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500">
                        <Boxes className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{selectedProduct.name}</h4>
                    <p className="text-cyan-400 font-mono text-[11px] mt-0.5">
                      SKU: {selectedProduct.sku_code || 'N/A'}
                    </p>
                    <p className="text-slate-400 text-[11px]">{selectedProduct.brand}</p>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 grid grid-cols-2 gap-3 text-center">
                  <div>
                    <span className="text-[11px] text-slate-400">Tồn kho hiện tại</span>
                    <p className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                      {selectedProduct.total_stock ?? 0}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400">Giá niêm yết</span>
                    <p className="text-sm font-bold font-mono text-slate-200 mt-1">
                      {Number(selectedProduct.base_price ?? 0).toLocaleString('vi-VN')} ₫
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Chưa chọn thiết bị nào.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
