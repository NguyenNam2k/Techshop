import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

function ToastNotification({ toasts = [], onRemove }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 pointer-events-none max-w-sm w-full">
      {toasts.map((t) => {
        const isSuccess = t.type === 'success';
        const isError = t.type === 'error';
        const isWarning = t.type === 'warning';

        let borderClass = 'border-cyan-500/40 text-cyan-200 bg-slate-900/95';
        let IconComponent = CheckCircle2;
        let iconColor = 'text-cyan-400';

        if (isError) {
          borderClass = 'border-rose-500/50 text-rose-200 bg-slate-900/95';
          IconComponent = AlertTriangle;
          iconColor = 'text-rose-400';
        } else if (isWarning) {
          borderClass = 'border-amber-500/50 text-amber-200 bg-slate-900/95';
          IconComponent = AlertCircle;
          iconColor = 'text-amber-400';
        } else if (!isSuccess) {
          borderClass = 'border-sky-500/40 text-sky-200 bg-slate-900/95';
          IconComponent = Info;
          iconColor = 'text-sky-400';
        }

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border ${borderClass} shadow-2xl backdrop-blur-md transition-all text-xs font-medium animate-in slide-in-from-top-2 duration-200`}
          >
            <IconComponent className={`w-4 h-4 shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 break-words leading-relaxed">{t.message}</div>
            <button
              type="button"
              onClick={() => onRemove(t.id)}
              className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default ToastNotification;

