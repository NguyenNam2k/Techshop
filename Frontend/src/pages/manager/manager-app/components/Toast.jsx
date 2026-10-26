import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const icons = {
  success: <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />,
  error: <XCircle className="w-4 h-4 text-rose-400 shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
  info: <Info className="w-4 h-4 text-cyan-400 shrink-0" />,
};

const colors = {
  success: 'border-emerald-500/40 bg-emerald-950/90 text-emerald-200 shadow-emerald-950/50',
  error: 'border-rose-500/40 bg-rose-950/90 text-rose-200 shadow-rose-950/50',
  warning: 'border-amber-500/40 bg-amber-950/90 text-amber-200 shadow-amber-950/50',
  info: 'border-cyan-500/40 bg-cyan-950/90 text-cyan-200 shadow-cyan-950/50',
};

let toastListeners = [];
let toastIdCounter = 0;

export function showToast(message, type = 'info') {
  if (!message) return;
  const id = ++toastIdCounter;
  toastListeners.forEach(listener => {
    try {
      listener({ id, message, type });
    } catch (e) {
      console.error('Error in toast listener:', e);
    }
  });
}

function ToastItem({ toast, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-xl text-xs font-semibold max-w-sm transition-all duration-300 animate-slide-up ${colors[toast.type] || colors.info}`}
    >
      {icons[toast.type] || icons.info}
      <span className="flex-1 leading-relaxed select-none">{toast.message}</span>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
        title="Đóng thông báo"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleNewToast = (newToast) => {
      setToasts(prev => [...prev.slice(-4), newToast]);
    };

    toastListeners.push(handleNewToast);
    return () => {
      toastListeners = toastListeners.filter(l => l !== handleNewToast);
    };
  }, []);

  const handleDismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[100] flex flex-col gap-2.5 pointer-events-none">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={handleDismiss} />
      ))}
    </div>
  );
}

export default ToastContainer;
