import React from 'react';
import {
  Cpu,
  Layers,
  PlusCircle,
  FolderTree,
  Boxes,
  ClipboardList,
  TicketPercent,
  BarChart3,
  UserCog,
  LogOut,
  Sun,
  Moon
} from 'lucide-react';

export default function Sidebar({
  activeView = 'products',
  onSelectView,
  categoryCount = 0,
  staffCount = 0,
  onOpenLogoutModal,
  theme = 'dark',
  onToggleTheme
}) {
  const navItems = [
    {
      group: 'Quản trị Danh mục',
      items: [
        {
          id: 'products',
          label: 'Quản lý thiết bị',
          icon: Layers,
          badge: 'Catalog'
        },
        {
          id: 'create-product',
          label: 'Thêm thiết bị công nghệ',
          icon: PlusCircle,
          badge: 'Mới'
        },
        {
          id: 'categories',
          label: 'Danh mục phần cứng',
          icon: FolderTree,
          count: categoryCount
        },
        {
          id: 'batch-stock',
          label: 'Nhập kho hàng loạt',
          icon: Boxes
        }
      ]
    },
    {
      group: 'Lịch sử kho vận',
      items: [
        {
          id: 'inventory-logs',
          label: 'Nhật ký tồn kho & Audit',
          icon: ClipboardList
        }
      ]
    },
    {
      group: 'Khuyến Mãi & Thống Kê',
      items: [
        {
          id: 'coupons',
          label: 'Mã giảm giá (Coupons)',
          icon: TicketPercent
        },
        {
          id: 'reports',
          label: 'Báo cáo tháng (Monthly)',
          icon: BarChart3
        }
      ]
    },
    {
      group: 'Nhân sự & Phân quyền',
      items: [
        {
          id: 'staffs',
          label: 'Nhân sự & Phân quyền',
          icon: UserCog,
          count: staffCount
        }
      ]
    }
  ];

  return (
    <aside className="w-64 bg-[#0f172a] border-r border-slate-800 flex flex-col shrink-0 min-h-screen">
      {/* Brand Logo */}
      <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectView('products')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-sky-200 to-violet-400 bg-clip-text text-transparent">
              TECHSHOP
            </h1>
            <p className="text-xs text-slate-400 font-mono">Manager Portal v1.0</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-4 custom-scrollbar overflow-y-auto">
        {navItems.map((group) => (
          <div key={group.group} className="space-y-1">
            <div className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              {group.group}
            </div>

            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectView(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left group ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-md shadow-cyan-500/10 font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-300'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>

                  {/* Badges / indicators */}
                  {item.count !== undefined ? (
                    <span
                      className={`ml-auto text-xs px-2 py-0.5 rounded-full font-mono shrink-0 ${
                        isActive
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60'
                          : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                      }`}
                    >
                      {item.count}
                    </span>
                  ) : item.badge ? (
                    <span
                      className={`ml-auto text-[10px] font-mono px-2 py-0.5 rounded-full shrink-0 ${
                        isActive
                          ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700/40'
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : isActive ? (
                    <span className="ml-auto w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400 shrink-0"></span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Theme Mode Toggle Switch */}
      <div className="px-4 py-3 border-t border-slate-800/80 bg-slate-900/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {theme === 'dark' ? (
              <Moon className="w-4 h-4 text-cyan-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" />
            )}
            <span className="text-xs font-medium text-slate-300">
              {theme === 'dark' ? 'Chế độ Tối' : 'Chế độ Sáng'}
            </span>
          </div>

          <button
            type="button"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Bật chế độ Sáng' : 'Bật chế độ Tối'}
            className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none p-0.5 cursor-pointer ${
              theme === 'dark'
                ? 'bg-cyan-950 border border-cyan-500/40'
                : 'bg-slate-300 border border-slate-400'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full shadow-sm block transform transition-transform duration-200 flex items-center justify-center ${
                theme === 'dark'
                  ? 'translate-x-5 bg-cyan-400 text-slate-950'
                  : 'translate-x-0 bg-white text-amber-500'
              }`}
            >
              {theme === 'dark' ? (
                <Moon className="w-2.5 h-2.5 text-slate-950" />
              ) : (
                <Sun className="w-2.5 h-2.5 text-amber-600" />
              )}
            </span>
          </button>
        </div>
      </div>

      {/* Database Status & Logout Card */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/60 space-y-3">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-semibold text-slate-300">MySQL Connection Pool</span>
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono">
            <span>Database:</span>
            <span className="text-cyan-400">techshop_db</span>
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono mt-1">
            <span>Engine:</span>
            <span className="text-slate-300">InnoDB ACID</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenLogoutModal}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Đăng xuất (Logout)</span>
        </button>
      </div>
    </aside>
  );
}
