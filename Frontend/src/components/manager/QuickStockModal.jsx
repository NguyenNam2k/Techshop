import React, { useState, useEffect } from 'react';
import { Boxes, X, Check, AlertCircle } from 'lucide-react';

function QuickStockModal({
  isOpen,
  onClose,
  products = [],
  selectedProduct = null,
  onSubmit,
  loading = false
}) {
  const [variantId, setVariantId] = useState('');
  const [quantityChange, setQuantityChange] = useState('');
  const [newStock, setNewStock] = useState('');
  const [note, setNote] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Selected item reference
  const currentItem = products.find(
    (p) => String(p.default_variant_id || p.id) === String(variantId)
  );

  useEffect(() => {
    if (selectedProduct) {
      setVariantId(selectedProduct.default_variant_id || selectedProduct.id);
      setNote(`Điều chỉnh tồn kho cho SKU ${selectedProduct.sku_code || ''}`);
    } else if (products.length > 0) {
      setVariantId(products[0].default_variant_id || products[0].id);
      setNote('');
    }
    setQuantityChange('');
    setNewStock('');
    setErrorMsg('');
  }, [selectedProduct, products, isOpen]);

  if (!isOpen) return null;

  // Calculate estimated stock after change
  const currentStock = currentItem?.total_stock ?? 0;
  let estimatedStock = currentStock;

  if (newStock !== '') {
    estimatedStock = Math.max(0, parseInt(newStock, 10) || 0);
  } else if (quantityChange !== '') {
    estimatedStock = currentStock + (parseInt(quantityChange, 10) || 0);
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!variantId) {
      setErrorMsg('Vui lòng chọn thiết bị cần điều chỉnh tồn kho.');
      return;
    }

    if (quantityChange === '' && newStock === '') {
      setErrorMsg('Vui lòng nhập "Số lượng thay đổi" hoặc "Thiết lập số tồn mới".');
      return;
    }

    if (quantityChange !== '') {
      const changeNum = parseInt(quantityChange, 10);
      if (isNaN(changeNum)) {
        setErrorMsg('Số lượng thay đổi phải là số nguyên.');
        return;
      }
      if (currentStock + changeNum < 0) {
        setErrorMsg(`Không thể trừ quá số tồn kho hiện tại (${currentStock}).`);
        return;
      }
    }

    if (newStock !== '') {
      const stockNum = parseInt(newStock, 10);
      if (isNaN(stockNum) || stockNum < 0) {
        setErrorMsg('Số tồn mới phải là số nguyên >= 0.');
        return;
      }
    }

    const item = {
      variant_id: parseInt(variantId, 10),
      note: note.trim()
    };

    if (newStock !== '') {
      item.new_stock = parseInt(newStock, 10);
    } else {
      item.quantity_change = parseInt(quantityChange, 10);
    }

    onSubmit({ items: [item] });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Điều Chỉnh Kho Hàng</h3>
              <p className="text-xs text-slate-400">
                Cập nhật số lượng nhập kho hoặc điều chỉnh tồn kho cho thiết bị
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Select Product / Variant */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Chọn thiết bị cần nhập / xuất kho:
            </label>
            <select
              value={variantId}
              onChange={(e) => setVariantId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white cursor-pointer focus:outline-none focus:border-violet-500"
            >
              {products.map((p) => (
                <option
                  key={p.default_variant_id || p.id}
                  value={p.default_variant_id || p.id}
                >
                  [{p.sku_code || 'SKU'}] {p.name} (Hiện có: {p.total_stock ?? 0})
                </option>
              ))}
            </select>
          </div>

          {/* Stock Preview Pill */}
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between font-mono">
            <div>
              <span className="text-slate-400">Tồn kho hiện tại:</span>{' '}
              <span className="font-bold text-white">{currentStock}</span>
            </div>
            <div>
              <span className="text-slate-400">Tồn sau điều chỉnh:</span>{' '}
              <span
                className={`font-bold ${
                  estimatedStock < 0
                    ? 'text-rose-400'
                    : estimatedStock === 0
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {estimatedStock}
              </span>
            </div>
          </div>

          {/* 2 Inputs: Quantity Change vs New Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
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
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-violet-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Dương (+) nhập thêm, Âm (-) trừ kho
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Hoặc Thiết lập số tồn mới
              </label>
              <input
                type="number"
                min="0"
                value={newStock}
                onChange={(e) => {
                  setNewStock(e.target.value);
                  if (e.target.value !== '') setQuantityChange('');
                }}
                placeholder="VD: 100"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-violet-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Ghi đè trực tiếp tồn kho mới
              </span>
            </div>
          </div>

          {/* Note Input */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Ghi chú điều chỉnh kho
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Nhập thêm lô hàng tháng 10 / Kiểm kê thực tế kho..."
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || estimatedStock < 0}
              className={`px-5 py-2 text-xs rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-violet-600/30 cursor-pointer ${
                loading || estimatedStock < 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>Xác Nhận Cập Nhật Kho</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default QuickStockModal;

