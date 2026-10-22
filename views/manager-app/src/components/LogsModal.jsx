import React, { useState, useEffect } from 'react';
import { ClipboardList, ShieldAlert, X, RefreshCw, Loader2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { showToast } from './Toast';

export default function LogsModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'audit'
  const [inventoryLogs, setInventoryLogs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      if (activeTab === 'inventory') {
        const res = await fetch('/api/logs/inventory?limit=50');
        const data = await res.json();
        if (data.success) setInventoryLogs(data.data || []);
      } else {
        const res = await fetch('/api/logs/audit?limit=50');
        const data = await res.json();
        if (data.success) setAuditLogs(data.data || []);
      }
    } catch (err) {
      showToast('Không thể tải nhật ký', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-card rounded-2xl w-full max-w-4xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-scale-in">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Nhật Ký Hệ Thống & Tồn Kho</h3>
              <p className="text-xs text-slate-400">
                Lịch sử các lần nhập kho, xuất kho và kiểm kê điều chỉnh tồn kho thiết bị
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

        {/* Tab & Refresh Bar */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('inventory')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'inventory'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Nhật Ký Tồn Kho ({inventoryLogs.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'audit'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Audit Log Kiểm Toán ({auditLogs.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={fetchLogs}
            disabled={loading}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 p-5 overflow-y-auto custom-scrollbar text-xs space-y-2">
          {loading ? (
            <div className="text-center py-12 text-slate-400 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
              <span>Đang tải danh sách nhật ký...</span>
            </div>
          ) : activeTab === 'inventory' ? (
            inventoryLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-400">Chưa có nhật ký biến động kho nào.</div>
            ) : (
              inventoryLogs.map((log) => {
                const change = Number(log.quantity_change ?? 0);
                const isPositive = change > 0;
                return (
                  <div
                    key={log.id}
                    className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                          isPositive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {isPositive ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-200">
                          {log.product_name || `Biến thể #${log.variant_id}`}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-cyan-400">{log.sku_code || 'N/A'}</span>
                          <span>•</span>
                          <span>{log.note || log.change_type || 'Điều chỉnh kho'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`font-mono font-bold text-sm ${
                          isPositive ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isPositive ? `+${change}` : change}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {log.created_at ? new Date(log.created_at).toLocaleString('vi-VN') : ''}
                      </div>
                    </div>
                  </div>
                );
              })
            )
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-400">Chưa có nhật ký kiểm toán nào.</div>
          ) : (
            auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between gap-3"
              >
                <div>
                  <div className="font-semibold text-slate-200 flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800/50">
                      {log.action_type || 'AUDIT'}
                    </span>
                    <span>{log.description || log.entity_type}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Thực hiện bởi: <span className="text-slate-300 font-medium">{log.username || 'Manager'}</span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {log.created_at ? new Date(log.created_at).toLocaleString('vi-VN') : ''}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
