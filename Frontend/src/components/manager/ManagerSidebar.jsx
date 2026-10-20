import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Cpu,
  Layers,
  FolderTree,
  Boxes,
  ClipboardList,
  LogOut,
  X,
  Server,
  Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function ManagerSidebar({
  categoriesCount = 0,
  onOpenCategories,
  onOpenBatchStock,
  onOpenLogs,
  isOpen,
  onClose
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const sidebarContent = (
    <aside className="w-64 bg-[#0f172a] border-r border-slate-800 flex flex-col h-full shrink-0 select-none">
      {/* Brand Logo */}
      <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-sky-200 to-violet-400 bg-clip-text text-transparent">
              TECHSHOP
            </h1>
            <p className="text-[11px] text-slate-400 font-mono">Manager Portal v1.0</p>
          </div>
        </div>

        {/* Mobile close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Quản trị Catalog
        </div>

        <NavLink
          to="/manager/products"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              isActive
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`
          }
        >
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Quản lý thiết bị</span>
          <span className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
            Active
          </span>
        </NavLink>

        <button
          type="button"
          onClick={onOpenCategories}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all text-left group"
        >
          <FolderTree className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span>Danh mục phần cứng</span>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono border border-slate-700/60">
            {categoriesCount}
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenBatchStock}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all text-left group"
        >
          <Boxes className="w-4 h-4 text-violet-400 group-hover:scale-110 transition-transform" />
          <span>Điều chỉnh kho hàng</span>
        </button>

        <div className="pt-4 px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Lịch sử kho vận
        </div>

        <button
          type="button"
          onClick={onOpenLogs}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all text-left group"
        >
          <ClipboardList className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          <span>Nhật ký tồn kho</span>
        </button>

        <div className="pt-4 px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Cửa hàng
        </div>

        <button
          type="button"
          onClick={() => navigate('/catalog')}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-all text-left"
        >
          <Activity className="w-4 h-4 text-sky-400" />
          <span>Xem Storefront</span>
        </button>
      </nav>

      {/* Database Status & User Info */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/60 space-y-3">
        <div className="px-2 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
              <Server className="w-3 h-3 text-emerald-400" />
              MySQL Pool Connected
            </span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
            <span>Database:</span>
            <span className="text-cyan-400">techshop_db</span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mt-0.5">
            <span>Engine:</span>
            <span className="text-slate-300">InnoDB ACID</span>
          </div>
        </div>

        {/* User Card & Logout */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-bold text-xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'M'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.name || 'Quản lý'}</p>
            <p className="text-[10px] text-cyan-400 font-mono truncate uppercase">
              {user?.role || 'Manager'}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          type="button"
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Đăng xuất (Logout)</span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <div className="hidden lg:block h-screen sticky top-0 shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile drawer with backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="relative z-10 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}

export default ManagerSidebar;

