import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import StaffPortalView from '../manager/manager-app/views/StaffPortalView';
import { LogOut, Sun, Moon, ShieldCheck, Clock, Building2 } from 'lucide-react';

export default function StaffPage() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const displayName = user?.full_name || user?.name || 'Nhân Viên Vận Hành';
  const staffCode = user?.staff_code || 'STF-OP';
  const department = user?.department || 'Warehouse & Operations';

  return (
    <div className={`min-h-screen flex flex-col font-sans ${isDark ? 'bg-[#0b0f19] text-[#f8fafc]' : 'bg-[#f8fafc] text-[#0f172a]'}`}>
      {/* Dedicated Staff Header Bar */}
      <header className={`sticky top-0 z-40 backdrop-blur-md px-4 py-2.5 flex items-center justify-between shadow-sm ${
        isDark
          ? 'bg-[#0b0f19]/95 border-b border-[#334155]'
          : 'bg-[#ffffff]/95 border-b border-[#e2e8f0]'
      }`}>
        {/* Left: Branding & Staff Badge */}
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm tracking-wider ${
            isDark
              ? 'bg-gradient-to-tr from-[#06b6d4] to-[#8b5cf6] shadow-md shadow-cyan-500/20'
              : 'bg-gradient-to-tr from-[#0891b2] to-[#7c3aed] shadow-md shadow-cyan-600/20'
          }`}>
            TG
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className={`font-extrabold text-sm tracking-wide ${
                isDark
                  ? 'bg-gradient-to-r from-[#22d3ee] via-[#67e8f9] to-[#a5b4fc] bg-clip-text text-transparent'
                  : 'bg-gradient-to-r from-[#0891b2] via-[#0e7490] to-[#7c3aed] bg-clip-text text-transparent'
              }`}>
                TECHGEAR STAFF
              </span>
              <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full ${
                isDark
                  ? 'bg-[#1e293b] text-[#22d3ee] border border-[#334155]'
                  : 'bg-[#ecfeff] text-[#0891b2] border border-[#0891b2]/20'
              }`}>
                Workspace
              </span>
            </div>
            <p className={`text-[10px] font-medium hidden sm:block ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
              Bàn Làm Việc Nhân Viên Vận Hành
            </p>
          </div>
        </div>

        {/* Center: Shift & Department status */}
        <div className={`hidden lg:flex items-center gap-3 rounded-lg px-3 py-1 text-[10px] ${
          isDark
            ? 'bg-[#1e293b]/60 border border-[#334155]/60'
            : 'bg-[#f1f5f9] border border-[#e2e8f0]'
        }`}>
          <div className={`flex items-center gap-1.5 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
            <Building2 className={`w-3 h-3 ${isDark ? 'text-[#22d3ee]' : 'text-[#0891b2]'}`} />
            <span><strong className={isDark ? 'text-[#f8fafc]' : 'text-[#0f172a]'}>{department}</strong></span>
          </div>
          <div className={`w-px h-3 ${isDark ? 'bg-[#334155]' : 'bg-[#e2e8f0]'}`} />
          <div className={`flex items-center gap-1.5 ${isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
            <Clock className="w-3 h-3 text-amber-400" />
            <span><strong className={isDark ? 'text-[#f8fafc]' : 'text-[#0f172a]'}>08:00 - 16:00 (Hôm nay)</strong></span>
          </div>
          <div className={`w-px h-3 ${isDark ? 'bg-[#334155]' : 'bg-[#e2e8f0]'}`} />
          <div className="flex items-center gap-1 text-emerald-500 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Sẵn sàng phục vụ</span>
          </div>
        </div>

        {/* Right: Staff Info, Theme Switcher & Logout */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              isDark
                ? 'bg-[#1e293b] border-[#334155] text-[#94a3b8] hover:text-[#f8fafc] hover:border-[#06b6d4]'
                : 'bg-[#ffffff] border-[#e2e8f0] text-[#64748b] hover:text-[#0f172a] hover:border-[#0891b2]'
            }`}
            title="Đổi giao diện Sáng / Tối"
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-500" />}
          </button>

          {/* User Profile Pill */}
          <div className={`flex items-center gap-2 rounded-lg px-2 py-1 ${
            isDark
              ? 'bg-[#1e293b] border border-[#334155]'
              : 'bg-[#f1f5f9] border border-[#e2e8f0]'
          }`}>
            <div className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[10px] ${
              isDark
                ? 'bg-[#06b6d4]/20 border border-[#06b6d4]/40 text-[#22d3ee]'
                : 'bg-[#0891b2]/10 border border-[#0891b2]/20 text-[#0891b2]'
            }`}>
              {displayName.charAt(0)}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-[11px] font-bold leading-tight flex items-center gap-1">
                {displayName}
                <span className={`px-1 py-0.5 text-[8px] font-mono font-bold rounded ${
                  isDark ? 'bg-[#0b0f19] text-[#94a3b8]' : 'bg-[#e2e8f0] text-[#64748b]'
                }`}>
                  {staffCode}
                </span>
              </div>
              <div className={`text-[9px] font-medium flex items-center gap-0.5 ${isDark ? 'text-[#22d3ee]' : 'text-[#0891b2]'}`}>
                <ShieldCheck className="w-2.5 h-2.5 inline" /> Nhân viên chính thức
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`flex items-center gap-1 px-2 py-1.5 text-[10px] font-bold rounded-lg border transition cursor-pointer ${
              isDark
                ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30 hover:border-rose-500/50'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200 hover:border-rose-300'
            }`}
            title="Đăng xuất khỏi hệ thống"
          >
            <LogOut className="w-3 h-3" />
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </header>

      {/* Main Staff Portal Operating Console — no extra padding, StaffPortalView handles its own layout */}
      <main className="flex-1">
        <StaffPortalView />
      </main>
    </div>
  );
}
