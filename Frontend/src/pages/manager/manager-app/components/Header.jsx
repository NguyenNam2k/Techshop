import React from 'react';
import { ChevronRight, PlusCircle, UserCog, RefreshCw, Sun, Moon, LogOut } from 'lucide-react';

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

export default function Header({
  activeView = 'products',
  onSelectView,
  theme = 'dark',
  onToggleTheme,
  user,
  onOpenLogoutModal
}) {
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
        {/* Nút chuyển giao diện Sáng / Tối - Chuẩn theo branch main */}
        <button
          type="button"
          onClick={onToggleTheme}
          title={theme === 'light' ? 'Chuyển sang giao diện tối' : 'Chuyển sang giao diện sáng'}
          aria-label="Chuyển đổi giao diện sáng / tối"
          className="p-2.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-slate-100 transition cursor-pointer flex items-center justify-center active:scale-95 shadow-sm"
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4 text-sky-400" />
          ) : (
            <Sun className="w-4 h-4 text-amber-400" />
          )}
        </button>

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

        {/* User Card & Nút Đăng Xuất trên Header chuẩn hóa theo Storefront / Admin */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-800">
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs shadow-sm">
            <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-bold text-[11px]">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'M'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-slate-200 font-semibold text-xs leading-tight truncate max-w-[120px]">
                {user?.name || 'Quản lý'}
              </div>
              <div className="text-[10px] text-cyan-400 font-mono leading-none uppercase">
                {user?.role || 'Manager'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenLogoutModal}
            title="Đăng xuất khỏi hệ thống"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Đăng xuất</span>
          </button>
        </div>
      </div>
    </header>
  );
}
