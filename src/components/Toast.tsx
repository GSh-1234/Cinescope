import React from 'react';
import { useWatchlist } from '../context/WatchlistContext';
import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useWatchlist();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl shadow-2xl backdrop-blur-md border animate-scale-in transition-all ${
              isSuccess
                ? 'bg-slate-900/95 text-slate-100 border-emerald-500/40 shadow-emerald-500/10'
                : isWarning
                ? 'bg-slate-900/95 text-slate-100 border-amber-500/40 shadow-amber-500/10'
                : 'bg-slate-900/95 text-slate-100 border-indigo-500/40 shadow-indigo-500/10'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {isSuccess ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              ) : isWarning ? (
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
              ) : (
                <Info className="w-5 h-5 text-indigo-400 flex-shrink-0" />
              )}
              <span className="text-xs sm:text-sm font-medium">{toast.message}</span>
            </div>

            <button
              onClick={() => dismissToast(toast.id)}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

