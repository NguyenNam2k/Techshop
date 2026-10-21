import React from 'react';
import {
  Monitor,
  CheckCircle,
  PackageCheck,
  AlertTriangle,
  AlertOctagon,
  FolderTree,
  ArrowRight
} from 'lucide-react';

function ProductStatsCards({ stats = {}, onOpenCategories }) {
  const totalProducts = stats.totalProducts ?? 0;
  const activeProducts = stats.activeProducts ?? 0;
  const totalStockUnits = stats.totalStockUnits ?? 0;
  const totalInventoryValue = stats.totalInventoryValue ?? 0;
  const lowStockCount = stats.lowStockCount ?? 0;
  const zeroStockCount = stats.zeroStockCount ?? 0;
  const totalCategories = stats.totalCategories ?? 0;

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* Card 1: Total Products */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group hover:border-cyan-500/40 transition-all shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Tổng Thiết Bị
            </p>
            <h3 className="text-2xl font-bold text-white mt-1.5 font-mono">
              {totalProducts}
            </h3>
            <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1 font-medium">
              <CheckCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{activeProducts} đang kinh doanh</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
            <Monitor className="w-6 h-6" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-transparent"></div>
      </div>

      {/* Card 2: Total Inventory Units */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group hover:border-violet-500/40 transition-all shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Tổng Tồn Kho
            </p>
            <h3 className="text-2xl font-bold text-white mt-1.5 font-mono">
              {Number(totalStockUnits).toLocaleString('vi-VN')}
            </h3>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 font-mono">
              <span>Trị giá: {Number(totalInventoryValue).toLocaleString('vi-VN')} ₫</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:scale-110 transition-transform">
            <PackageCheck className="w-6 h-6" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-transparent"></div>
      </div>

      {/* Card 3: Low Stock Warnings */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group hover:border-amber-500/40 transition-all shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Cảnh Báo Tồn Kho
            </p>
            <h3 className="text-2xl font-bold text-amber-400 mt-1.5 font-mono">
              {lowStockCount}
            </h3>
            <p className="text-xs text-rose-400 mt-1 flex items-center gap-1 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{zeroStockCount} biến thể hết sạch hàng</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
            <AlertOctagon className="w-6 h-6" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-transparent"></div>
      </div>

      {/* Card 4: Categories */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-500/40 transition-all shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Danh Mục Quản Trị
            </p>
            <h3 className="text-2xl font-bold text-white mt-1.5 font-mono">
              {totalCategories}
            </h3>
            <button
              type="button"
              onClick={onOpenCategories}
              className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline mt-1 flex items-center gap-1 font-medium transition-colors"
            >
              <span>Quản lý & chuyển giao</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
            <FolderTree className="w-6 h-6" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-transparent"></div>
      </div>
    </section>
  );
}

export default ProductStatsCards;

