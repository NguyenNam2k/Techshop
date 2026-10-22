import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import Sidebar from '../../components/admin/Sidebar';
import { useTheme } from '../../context/ThemeContext';

function AdminLayout() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 px-6 border-b border-slate-700/80 bg-slate-800/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-20">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
            🛡️ BẢNG ĐIỀU KHIỂN QUẢN TRỊ VIÊN HỆ THỐNG
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'light' ? 'Chuyển sang giao diện tối' : 'Chuyển sang giao diện sáng'}
            aria-label="Chuyển đổi giao diện sáng / tối"
            className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white border border-slate-600 transition cursor-pointer flex items-center justify-center active:scale-95 shadow-sm"
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-sky-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>
        </header>
        <main className="flex-1 p-6 overflow-auto custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
