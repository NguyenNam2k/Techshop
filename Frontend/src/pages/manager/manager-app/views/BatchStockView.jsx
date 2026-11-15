import React, { useState, useEffect, useMemo } from 'react';
import {
  Boxes,
  Check,
  Loader2,
  RefreshCw,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  PackageCheck,
  Search,
  Plus,
  Minus,
  ArrowLeft,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { showToast } from '../components/Toast';

export default function BatchStockView({
  products = [],
  initialTarget = null,
  onSuccess,
  onBackToProducts
}) {
  // Danh sách toàn bộ biến thể được tải trực tiếp từ Backend (86 biến thể)
  const [variants, setVariants] = useState([]);
  const [loadingVariants, setLoadingVariants] = useState(true);

  // Biến thể đang được chọn
  const [selectedVariantId, setSelectedVariantId] = useState('');

  // Chế độ điều chỉnh: 'change' (Thêm/Bớt số lượng) | 'set' (Thiết lập tồn mới)
  const [adjustMode, setAdjustMode] = useState('change'); // 'change' | 'set'

  // Hành vi khi ở chế độ 'change': 'add' (+) | 'subtract' (-)
  const [changeType, setChangeType] = useState('add'); // 'add' | 'subtract'
  const [quantityInput, setQuantityInput] = useState('');

  // Ô nhập khi ở chế độ 'set'
  const [newStockInput, setNewStockInput] = useState('');

  // Ghi chú lý do điều chỉnh
  const [note, setNote] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tải danh sách đầy đủ tất cả các biến thể từ API
  const fetchAllVariants = async () => {
    try {
      setLoadingVariants(true);
      const res = await fetch('/api/products/inventory/variants');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setVariants(json.data);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách biến thể:', err);
      showToast('Không thể tải danh mục biến thể kho hàng', 'error');
    } finally {
      setLoadingVariants(false);
    }
  };

  useEffect(() => {
    fetchAllVariants();
  }, []);

  // Thiết lập biến thể được chọn ban đầu (từ initialTarget hoặc biến thể đầu tiên)
  useEffect(() => {
    if (variants.length === 0) return;

    if (initialTarget) {
      // Tìm theo variant_id chính xác
      const targetVarId = Number(initialTarget.variant_id);
      const foundByVarId = variants.find((v) => Number(v.variant_id) === targetVarId);

      if (foundByVarId) {
        setSelectedVariantId(String(foundByVarId.variant_id));
        return;
      }

      // Nếu không khớp variant_id, thử tìm theo product_id hoặc SKU
      if (initialTarget.product_id) {
        const foundByProdId = variants.find(
          (v) => Number(v.product_id) === Number(initialTarget.product_id)
        );
        if (foundByProdId) {
          setSelectedVariantId(String(foundByProdId.variant_id));
          return;
        }
      }

      if (initialTarget.sku_code) {
        const foundBySku = variants.find((v) => v.sku === initialTarget.sku_code);
        if (foundBySku) {
          setSelectedVariantId(String(foundBySku.variant_id));
          return;
        }
      }
    }

    // Nếu chưa chọn biến thể nào, chọn biến thể đầu tiên
    if (!selectedVariantId && variants.length > 0) {
      setSelectedVariantId(String(variants[0].variant_id));
    }
  }, [variants, initialTarget]);

  // Biến thể hiện tại đang được chọn
  const currentVariant = useMemo(() => {
    return variants.find((v) => String(v.variant_id) === String(selectedVariantId)) || null;
  }, [variants, selectedVariantId]);

  // Lọc biến thể theo từ khóa tìm kiếm (Tên sản phẩm, SKU, Thương hiệu, Màu sắc, Switch)
  const filteredVariants = useMemo(() => {
    if (!searchTerm.trim()) return variants;
    const kw = searchTerm.toLowerCase().trim();
    return variants.filter(
      (v) =>
        (v.product_name || '').toLowerCase().includes(kw) ||
        (v.sku || '').toLowerCase().includes(kw) ||
        (v.brand || '').toLowerCase().includes(kw) ||
        (v.color || '').toLowerCase().includes(kw) ||
        (v.spec_version || '').toLowerCase().includes(kw) ||
        (v.category_name || '').toLowerCase().includes(kw)
    );
  }, [variants, searchTerm]);

  // Tính toán tồn kho dự kiến sau khi điều chỉnh
  const calculationPreview = useMemo(() => {
    if (!currentVariant) return null;

    const currentStock = Number(currentVariant.stock ?? 0);

    if (adjustMode === 'change') {
      const rawQty = quantityInput.trim();
      if (!rawQty) return null;

      // Xử lý nếu người dùng tự gõ dấu + hoặc - trong ô nhập
      let parsedNum = parseInt(rawQty, 10);
      if (isNaN(parsedNum)) return { error: 'Vui lòng nhập số hợp lệ' };

      let netChange = parsedNum;
      if (changeType === 'subtract') {
        netChange = -Math.abs(parsedNum);
      } else if (changeType === 'add') {
        netChange = Math.abs(parsedNum);
      }

      const projectedStock = currentStock + netChange;
      const isInvalid = projectedStock < 0;

      return {
        currentStock,
        netChange,
        projectedStock,
        isInvalid,
        error: isInvalid
          ? `Tồn kho hiện có chỉ còn ${currentStock} cái. Không thể xuất quá số lượng này!`
          : null
      };
    } else {
      // Chế độ 'set': Thiết lập số tồn mới trực tiếp
      const rawNew = newStockInput.trim();
      if (!rawNew) return null;

      const parsedNew = parseInt(rawNew, 10);
      if (isNaN(parsedNew) || parsedNew < 0) {
        return { error: 'Số tồn mới phải là số nguyên lớn hơn hoặc bằng 0' };
      }

      const netChange = parsedNew - currentStock;

      return {
        currentStock,
        netChange,
        projectedStock: parsedNew,
        isInvalid: false,
        error: null
      };
    }
  }, [currentVariant, adjustMode, changeType, quantityInput, newStockInput]);

  // Xử lý gửi yêu cầu điều chỉnh tồn kho
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentVariant) {
      showToast('Vui lòng chọn biến thể thiết bị cần điều chỉnh', 'warning');
      return;
    }

    if (!calculationPreview) {
      showToast('Vui lòng nhập số lượng điều chỉnh', 'warning');
      return;
    }

    if (calculationPreview.error || calculationPreview.isInvalid) {
      showToast(calculationPreview.error || 'Dữ liệu tồn kho không hợp lệ', 'error');
      return;
    }

    if (calculationPreview.netChange === 0) {
      showToast('Số lượng thay đổi bằng 0, không có biến động tồn kho', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const itemPayload = {
        variant_id: Number(currentVariant.variant_id)
      };

      if (adjustMode === 'change') {
        itemPayload.quantity_change = calculationPreview.netChange;
      } else {
        itemPayload.new_stock = calculationPreview.projectedStock;
      }

      const defaultNote =
        adjustMode === 'change'
          ? calculationPreview.netChange > 0
            ? `Nhập thêm kho +${calculationPreview.netChange} cái`
            : `Xuất kho điều chỉnh giảm ${Math.abs(calculationPreview.netChange)} cái`
          : `Kiểm kê thiết lập số tồn mới ${calculationPreview.projectedStock} cái`;

      const payload = {
        items: [itemPayload],
        note: note.trim() || defaultNote
      };

      const res = await fetch('/api/products/batch-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Lỗi cập nhật tồn kho từ máy chủ');
      }

      const updatedResult = data.data?.results?.[0];
      const stockAfter =
        updatedResult?.stock_after !== undefined
          ? updatedResult.stock_after
          : calculationPreview.projectedStock;

      // Cập nhật ngay lập tức vào state nội bộ của variants để UI nhảy số tức thì
      setVariants((prev) =>
        prev.map((v) => {
          if (v.variant_id === currentVariant.variant_id) {
            const oldStock = Number(v.stock || 0);
            const diff = stockAfter - oldStock;
            return {
              ...v,
              stock: stockAfter,
              total_product_stock: Number(v.total_product_stock || 0) + diff,
              variant_status: stockAfter > 0 ? 'available' : 'out_of_stock'
            };
          }
          // Nếu cùng product_id thì cập nhật lại total_product_stock
          if (v.product_id === currentVariant.product_id) {
            const oldCurrentVar = prev.find((item) => item.variant_id === currentVariant.variant_id);
            const oldStock = Number(oldCurrentVar?.stock || 0);
            const diff = stockAfter - oldStock;
            return {
              ...v,
              total_product_stock: Number(v.total_product_stock || 0) + diff
            };
          }
          return v;
        })
      );

      showToast(
        `Đã cập nhật SKU [${currentVariant.sku}]: Tồn kho mới là ${stockAfter} cái!`,
        'success'
      );

      // Reset ô nhập
      setQuantityInput('');
      setNewStockInput('');
      setNote('');

      // Gọi callback để đồng bộ danh sách ngoài ProductTable và KPI cards
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Lỗi batchAdjustStock:', err);
      showToast(err.message || 'Lỗi điều chỉnh tồn kho', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Top Header & Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            {onBackToProducts && (
              <button
                type="button"
                onClick={onBackToProducts}
                className="p-1.5 rounded-lg border border-slate-700 hover:border-slate-600 bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
                title="Quay lại danh sách thiết bị"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <Boxes className="w-6 h-6 text-violet-400" />
              <span>Quản Lý Nhập Kho & Điều Chỉnh Tồn Kho</span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 sm:ml-9">
            Hỗ trợ nhập thêm theo lô, xuất giảm tồn và kiểm kê đối soát chính xác theo từng SKU biến thể
          </p>
        </div>

        {onBackToProducts && (
          <button
            type="button"
            onClick={onBackToProducts}
            className="px-3.5 py-1.5 rounded-xl border border-slate-700 hover:border-slate-600 bg-slate-800/80 hover:bg-slate-800 text-xs text-slate-300 hover:text-white transition flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Về danh sách thiết bị</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form điều chỉnh tồn kho bên trái */}
        <div className="lg:col-span-7 glass-card rounded-2xl p-6 border border-slate-800 space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-violet-400" />
              <span>Biểu Mẫu Điều Chỉnh Tồn Kho</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Tổng {variants.length} biến thể kho
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Lọc & Chọn biến thể */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Chọn biến thể thiết bị <span className="text-rose-400">*</span>
                </label>
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="text-[10px] text-cyan-400 hover:underline"
                  >
                    Xóa tìm kiếm
                  </button>
                )}
              </div>

              {/* Ô tìm kiếm nhanh SKU / Tên sản phẩm */}
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Gõ tìm nhanh: Tên thiết bị, SKU, màu sắc, switch..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>

              {loadingVariants ? (
                <div className="flex items-center gap-2 py-3 px-4 bg-slate-800 rounded-xl text-slate-400 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                  <span>Đang tải danh mục biến thể...</span>
                </div>
              ) : (
                <select
                  value={selectedVariantId}
                  onChange={(e) => setSelectedVariantId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white cursor-pointer focus:outline-none focus:border-violet-500 font-mono"
                >
                  {filteredVariants.length === 0 ? (
                    <option value="" disabled>
                      Không tìm thấy biến thể nào phù hợp
                    </option>
                  ) : (
                    filteredVariants.map((v) => (
                      <option key={v.variant_id} value={v.variant_id}>
                        [{v.sku}] {v.product_name} {v.color ? `• ${v.color}` : ''} (Tồn: {v.stock} cái)
                      </option>
                    ))
                  )}
                </select>
              )}
            </div>

            {/* Chuyển đổi 2 chế độ điều chỉnh */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Phương thức điều chỉnh kho:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustMode('change')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition flex items-center justify-center gap-2 ${
                    adjustMode === 'change'
                      ? 'bg-violet-600/20 border-violet-500 text-violet-300 shadow-sm'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                  <span>Nhập Thêm / Xuất Bớt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustMode('set')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition flex items-center justify-center gap-2 ${
                    adjustMode === 'set'
                      ? 'bg-cyan-600/20 border-cyan-500 text-cyan-300 shadow-sm'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <PackageCheck className="w-4 h-4 text-cyan-400" />
                  <span>Kiểm Kê Tồn Mới</span>
                </button>
              </div>
            </div>

            {/* CHẾ ĐỘ 1: NHẬP THÊM / XUẤT BỚT */}
            {adjustMode === 'change' && (
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 animate-fade-in">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-300 font-medium">Hành động:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setChangeType('add')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        changeType === 'add'
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 hover:text-emerald-400'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Nhập thêm (+)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setChangeType('subtract')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        changeType === 'subtract'
                          ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                          : 'bg-slate-800 text-slate-400 hover:text-rose-400'
                      }`}
                    >
                      <Minus className="w-3.5 h-3.5" />
                      <span>Xuất bớt (-)</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    {changeType === 'add'
                      ? 'Số lượng nhập thêm vào kho'
                      : 'Số lượng xuất bớt / giảm kho'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={quantityInput}
                      onChange={(e) => setQuantityInput(e.target.value)}
                      placeholder={changeType === 'add' ? 'Ví dụ: 10, 20...' : 'Ví dụ: 2, 5...'}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-violet-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                      thiết bị
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* CHẾ ĐỘ 2: THIẾT LẬP TỒN MỚI TRỰC TIẾP */}
            {adjustMode === 'set' && (
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 animate-fade-in">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Thiết lập số lượng tồn kho mới thực tế (Kiểm kê kho)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={newStockInput}
                      onChange={(e) => setNewStockInput(e.target.value)}
                      placeholder="Nhập số tồn kho thực tế, ví dụ: 50"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                      thiết bị
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Hệ thống sẽ tự động đối soát và tính toán chênh lệch so với số tồn hiện tại
                  </span>
                </div>
              </div>
            )}

            {/* BẢNG TÍNH TOÁN DỰ KIẾN (LIVE CALCULATION PREVIEW) */}
            {calculationPreview && (
              <div
                className={`p-3.5 rounded-xl border text-xs transition-all ${
                  calculationPreview.isInvalid
                    ? 'bg-rose-950/40 border-rose-800/80 text-rose-300'
                    : 'bg-slate-900/80 border-slate-700/80 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-[11px] text-slate-400">Dự tính biến động tồn kho:</span>
                  {calculationPreview.isInvalid ? (
                    <span className="flex items-center gap-1 text-rose-400 text-[11px] font-bold">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Không hợp lệ</span>
                    </span>
                  ) : (
                    <span className="text-emerald-400 text-[11px] font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Hợp lệ</span>
                    </span>
                  )}
                </div>

                <div className="mt-2 grid grid-cols-3 gap-2 text-center font-mono">
                  <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/40">
                    <div className="text-[10px] text-slate-400 font-sans">Hiện có</div>
                    <div className="text-sm font-bold text-slate-200 mt-0.5">
                      {calculationPreview.currentStock}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/40">
                    <div className="text-[10px] text-slate-400 font-sans">Biến động</div>
                    <div
                      className={`text-sm font-bold mt-0.5 ${
                        calculationPreview.netChange > 0
                          ? 'text-emerald-400'
                          : calculationPreview.netChange < 0
                          ? 'text-amber-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {calculationPreview.netChange > 0
                        ? `+${calculationPreview.netChange}`
                        : calculationPreview.netChange}
                    </div>
                  </div>
                  <div
                    className={`p-2 rounded-lg border ${
                      calculationPreview.isInvalid
                        ? 'bg-rose-900/40 border-rose-700 text-rose-300'
                        : 'bg-violet-950/40 border-violet-700/50 text-violet-300'
                    }`}
                  >
                    <div className="text-[10px] text-slate-400 font-sans">Tồn mới</div>
                    <div className="text-sm font-bold mt-0.5">
                      {calculationPreview.projectedStock}
                    </div>
                  </div>
                </div>

                {calculationPreview.error && (
                  <p className="mt-2 text-[11px] text-rose-400 font-medium flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{calculationPreview.error}</span>
                  </p>
                )}
              </div>
            )}

            {/* Ghi chú lý do */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Ghi chú điều chỉnh / Lý do nhập xuất
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="VD: Nhập thêm lô hàng mới / Kiểm kê kho định kỳ / Bù trừ hao hụt..."
                className="w-full px-3.5 py-2.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-violet-500"
              />
            </div>

            {/* Nút Submit */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={isSubmitting || calculationPreview?.isInvalid}
                className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-violet-600/30 disabled:opacity-50 transition-all cursor-pointer"
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

        {/* Thẻ xem chi tiết biến thể đang chọn bên phải */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-cyan-400" />
              <span>Biến Thể Đang Được Chọn</span>
            </h3>

            {currentVariant ? (
              <div className="space-y-4 text-xs">
                {/* Ảnh và thông tin định danh */}
                <div className="flex items-start gap-3.5">
                  <div className="w-16 h-16 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 shadow-md">
                    {currentVariant.thumbnail_url ? (
                      <img
                        src={currentVariant.thumbnail_url}
                        alt={currentVariant.product_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500">
                        <Boxes className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-white text-sm leading-snug line-clamp-2">
                      {currentVariant.product_name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-cyan-400 font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">
                        SKU: {currentVariant.sku}
                      </span>
                      <span className="text-slate-400 text-[11px]">{currentVariant.brand}</span>
                    </div>
                    {currentVariant.category_name && (
                      <span className="text-slate-400 text-[10px] mt-1 block">
                        Danh mục: {currentVariant.category_name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Đặc tính biến thể: Màu sắc, phiên bản */}
                {(currentVariant.color || currentVariant.spec_version) && (
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-1.5">
                    {currentVariant.color && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Màu sắc / Phân loại:</span>
                        <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                          {currentVariant.color_code && (
                            <span
                              className="w-3 h-3 rounded-full border border-slate-600 inline-block"
                              style={{ backgroundColor: currentVariant.color_code }}
                            />
                          )}
                          <span>{currentVariant.color}</span>
                        </span>
                      </div>
                    )}
                    {currentVariant.spec_version && (
                      <div className="flex items-start justify-between text-[11px] gap-2 pt-1 border-t border-slate-800">
                        <span className="text-slate-400 shrink-0">Cấu hình:</span>
                        <span className="font-medium text-slate-300 text-right">
                          {currentVariant.spec_version}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Số liệu kho hàng chi tiết */}
                <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 grid grid-cols-2 gap-3 text-center">
                  <div className="p-2 rounded-lg bg-slate-800/40 border border-slate-700/50">
                    <span className="text-[11px] text-slate-400 block">Tồn kho biến thể này</span>
                    <p className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
                      {currentVariant.stock ?? 0}
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {currentVariant.stock > 0 ? 'Có sẵn để bán' : 'Hết hàng biến thể'}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-800/40 border border-slate-700/50">
                    <span className="text-[11px] text-slate-400 block">Tổng tồn cả thiết bị</span>
                    <p className="text-xl font-bold font-mono text-cyan-400 mt-0.5">
                      {currentVariant.total_product_stock ?? currentVariant.stock ?? 0}
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono">
                      (Tất cả phân loại)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between px-3 py-2 bg-slate-900/50 rounded-xl border border-slate-800 text-[11px]">
                  <span className="text-slate-400">Giá niêm yết biến thể:</span>
                  <span className="font-bold font-mono text-slate-200">
                    {Number(currentVariant.variant_price ?? 0).toLocaleString('vi-VN')} ₫
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-violet-950/20 border border-violet-800/30 flex items-start gap-2 text-[11px] text-violet-300">
                  <Info className="w-4 h-4 shrink-0 text-violet-400 mt-0.5" />
                  <span>
                    Mọi biến động sẽ tự động cập nhật tổng tồn kho của thiết bị và ghi lại vào Nhật Ký Kiểm Toán (Inventory Logs).
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-xs">
                Chưa chọn biến thể thiết bị nào
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
