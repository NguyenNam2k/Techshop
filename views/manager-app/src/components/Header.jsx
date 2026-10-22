import React from 'react';
import { ChevronRight, PlusCircle, UserCog, RefreshCw } from 'lucide-react';

const viewTitles = {
  products: 'Danh Sách Thiết Bị Công Nghệ',
  'create-product': 'Thêm Thiết Bị Công Nghệ Mới',
  categories: 'Quản Lý Danh Mục Phần Cứng',
  'batch-stock': 'Điều Chỉnh Tồn Kho & Nhập Hàng Loạt',
  'inventory-logs': 'Nhật Ký Tồn Kho & Audit Kiểm Toán',
  coupons: 'Quản Lý Mã Giảm Giá & Khuyến Mãi',
  reports: 'Báo Cáo Hoạt Động & Doanh Thu Tháng',
  staffs: 'Phân Quyền & Quản Lý Nhân Sự'
};

export default function Header({ activeView = 'products', onSelectView }) {
  return (
    <header className="h-16 px-8 border-b border-slate-800 bg-[#0f172a]/70 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3 text-sm text-slate-400">
        <span
          className="hover:text-slate-200 cursor-pointer"
          onClick={() => onSelectView('products')}
        >
          Bảng điều khiển
        </span>
        <ChevronRight className="w-4 h-4 text-slate-600" />
        <span
          className="hover:text-slate-200 cursor-pointer"
          onClick={() => onSelectView('products')}
        >
          Catalog Quản trị
        </span>
        <ChevronRight className="w-4 h-4 text-slate-600" />
        <span className="text-cyan-400 font-medium">{viewTitles[activeView] || 'Quản trị'}</span>
      </div>

      <div className="flex items-center gap-3">
        {activeView !== 'create-product' && (
          <button
            type="button"
            onClick={() => onSelectView('create-product')}
            className="px-3.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-medium border border-cyan-500/30 transition-all flex items-center gap-2"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Thêm thiết bị mới</span>
          </button>
        )}

        {activeView !== 'batch-stock' && (
          <button
            type="button"
            onClick={() => onSelectView('batch-stock')}
            className="px-3.5 py-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 text-xs font-medium border border-violet-500/30 transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Điều chỉnh tồn kho</span>
          </button>
        )}

        {activeView !== 'staffs' && (
          <button
            type="button"
            onClick={() => onSelectView('staffs')}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-all flex items-center gap-2"
          >
            <UserCog className="w-3.5 h-3.5" />
            <span>Phân quyền nhân sự</span>
          </button>
        )}
      </div>
    </header>
  );
}
