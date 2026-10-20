import React from 'react';
import { AlertTriangle, Trash2, X, Boxes, ShieldAlert } from 'lucide-react';

function DeleteConfirmModal({
  isOpen,
  onClose,
  product = null,
  onConfirmDelete,
  onOpenQuickStock,
  loading = false
}) {
  if (!isOpen || !product) return null;

  const stock = product.total_stock ?? 0;
  const hasStock = stock > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 text-center space-y-4">
        {hasStock ? (
          /* BLOCKED: Stock Guard Active */
          <>
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">
                Không Thể Xóa Thiết Bị
              </h3>
              <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-left text-xs text-amber-200/90 leading-relaxed space-y-1">
                <p>
                  Thiết bị <b className="text-white">"{product.name}"</b> hiện vẫn còn{' '}
                  <b className="text-amber-400 font-mono">{stock} sản phẩm</b> tồn kho trong hệ thống.
                </p>
                <p className="text-[11px] text-amber-300/80">
                  Quy tắc an toàn kho (Stock Guard Rule) nghiêm cấm xóa thiết bị đang còn tồn kho thực tế. Vui lòng điều chỉnh tồn kho về 0 trước khi xóa!
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Đã hiểu
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenQuickStock) onOpenQuickStock(product);
                }}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-violet-600/30 cursor-pointer"
              >
                <Boxes className="w-4 h-4" />
                <span>Điều chỉnh kho ngay</span>
              </button>
            </div>
          </>
        ) : (
          /* ALLOWED: Zero stock, confirm deletion */
          <>
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <Trash2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Xác Nhận Xóa Thiết Bị</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Bạn có chắc chắn muốn xóa vĩnh viễn thiết bị{' '}
                <b className="text-slate-200">"{product.name}"</b> (ID: #{product.id})?
              </p>
              <p className="text-[11px] text-rose-400 mt-1 font-mono">
                Tồn kho hiện tại: 0 cái &bull; Thao tác này không thể hoàn tác!
              </p>
            </div>

            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                disabled={loading}
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => onConfirmDelete(product.id)}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-600/30 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>Xác nhận xóa</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default DeleteConfirmModal;
