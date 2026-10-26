import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  ShieldAlert,
  RefreshCw,
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
  Search
} from 'lucide-react';
import { showToast } from '../components/Toast';

export default function InventoryLogsView() {
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'audit'
  const [inventoryLogs, setInventoryLogs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      if (activeTab === 'inventory') {
        const res = await fetch('/api/logs/inventory?limit=100');
        const data = await res.json();
        if (data.success) setInventoryLogs(data.data || []);
      } else {
        const res = await fetch('/api/logs/audit?limit=100');
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
    fetchLogs();
  }, [activeTab]);

  const filteredInventoryLogs = inventoryLogs.filter((l) =>
    (l.product_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.sku_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.note || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAuditLogs = auditLogs.filter((l) =>
    (l.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.action_type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.username || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <ClipboardList className="w-6 h-6 text-cyan-400" />
            <span>Nhật Ký Tồn Kho & Kiểm Toán Hệ Thống</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Theo dõi chi tiết các lần nhập kho, trừ kho bán lẻ và lịch sử audit của Quản lý
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchLogs}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all flex items-center gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm Mới</span>
          </button>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-slate-900/60 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'inventory'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'bg-slate-800/80 text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Nhật Ký Tồn Kho ({inventoryLogs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'audit'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'bg-slate-800/80 text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Audit Log ({auditLogs.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo sản phẩm, SKU, lý do..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {/* Log list */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden divide-y divide-slate-800/60">
        {loading ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
            <span>Đang tải nhật ký...</span>
          </div>
        ) : activeTab === 'inventory' ? (
          filteredInventoryLogs.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              Chưa có nhật ký biến động kho nào phù hợp.
            </div>
          ) : (
            filteredInventoryLogs.map((log) => {
              const change = Number(log.quantity_change ?? 0);
              const isPositive = change > 0;
              return (
                <div
                  key={log.id}
                  className="p-4 hover:bg-slate-800/30 transition-colors flex items-center justify-between gap-4 text-xs"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
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
                        <span className="font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                          {log.sku_code || 'N/A'}
                        </span>
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
        ) : filteredAuditLogs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            Chưa có bản ghi kiểm toán nào phù hợp.
          </div>
        ) : (
          filteredAuditLogs.map((log) => (
            <div
              key={log.id}
              className="p-4 hover:bg-slate-800/30 transition-colors flex items-center justify-between gap-4 text-xs"
            >
              <div>
                <div className="font-semibold text-slate-200 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800/50">
                    {log.action_type || 'AUDIT'}
                  </span>
                  <span>{log.description || log.entity_type}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Thực hiện bởi: <span className="text-slate-300 font-medium">{log.username || 'Manager'}</span>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                {log.created_at ? new Date(log.created_at).toLocaleString('vi-VN') : ''}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
