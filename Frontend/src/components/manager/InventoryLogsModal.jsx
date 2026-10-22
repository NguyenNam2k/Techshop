import React, { useState, useEffect } from 'react';
import { ClipboardList, X, RotateCcw, AlertCircle } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

function InventoryLogsModal({ isOpen, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get('/logs/inventory?limit=40');
      if (res.data.success || Array.isArray(res.data.data)) {
        setLogs(res.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi tải lịch sử kho.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Nhật Ký Nhập Xuất Kho</h3>
              <p className="text-xs text-slate-400">
                Lịch sử các lần nhập kho, xuất kho và kiểm kê điều chỉnh tồn kho thiết bị
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={fetchLogs}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Làm mới"
            >
              <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="p-5 overflow-y-auto flex-1 space-y-2 text-xs">
          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <div className="w-8 h-8 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p>Đang tải lịch sử nhập xuất kho...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-center flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              Chưa có bản ghi nhật ký nhập xuất kho nào được ghi nhận.
            </div>
          ) : (
            logs.map((log, idx) => {
              const isPositive = (log.quantity_changed ?? 0) >= 0;
              const dateStr = log.created_at
                ? new Date(log.created_at).toLocaleString('vi-VN')
                : 'Vừa xong';

              return (
                <div
                  key={log.id || idx}
                  className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-cyan-400 font-bold">
                        [{log.sku || 'SKU'}]
                      </span>
                      <span className="text-slate-200 font-medium truncate">
                        {log.product_name || 'Thiết bị'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 truncate">
                      {log.note || 'Không có ghi chú chi tiết'}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`font-mono font-bold ${
                        isPositive ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isPositive ? '+' : ''}
                      {log.quantity_changed} cái
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Tồn sau: <span className="text-slate-200">{log.stock_after}</span> |{' '}
                      {dateStr}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default InventoryLogsModal;
