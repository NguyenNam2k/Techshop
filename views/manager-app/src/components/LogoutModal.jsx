import React from 'react';
import { LogOut } from 'lucide-react';

export default function LogoutModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-card rounded-2xl w-full max-w-sm border border-slate-800 overflow-hidden shadow-2xl p-6 text-center space-y-4 animate-scale-in">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
          <LogOut className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Xác Nhận Đăng Xuất</h3>
          <p className="text-xs text-slate-400 mt-1">
            Bạn có chắc chắn muốn kết thúc phiên làm việc của Quản Lý (Manager)?
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Ở lại
          </button>
          <a
            href="/logout"
            className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Đăng xuất ngay</span>
          </a>
        </div>
      </div>
    </div>
  );
}
