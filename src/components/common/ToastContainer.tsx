import React, { useState, useEffect } from 'react';
import { toast, ToastMessage } from '@/lib/toast';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    return toast.subscribe((updated) => setToasts(updated));
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((t) => {
        const isSuccess = t.type === 'success';
        const isError = t.type === 'error';

        return (
          <div
            key={t.id}
            className={`pointer-events-auto bg-white border rounded-2xl p-3.5 shadow-elevated flex items-start gap-3 transition-all animate-fadeIn ${
              isSuccess
                ? 'border-teal-300 shadow-teal/10'
                : isError
                ? 'border-coral-300 shadow-coral/10'
                : 'border-violet-300 shadow-violet/10'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                isSuccess
                  ? 'bg-brand-aqua text-brand-teal'
                  : isError
                  ? 'bg-brand-peach text-brand-coral'
                  : 'bg-brand-lavender text-brand-violet'
              }`}
            >
              {isSuccess ? (
                <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
              ) : isError ? (
                <AlertTriangle className="w-4 h-4 stroke-[2.2]" />
              ) : (
                <Info className="w-4 h-4 stroke-[2.2]" />
              )}
            </div>

            <div className="flex-1 min-w-0 pr-1">
              {t.title && (
                <h4 className="font-extrabold text-xs text-brand-text truncate">
                  {t.title}
                </h4>
              )}
              <p className="text-xs text-brand-muted mt-0.5 leading-relaxed">
                {t.message}
              </p>
            </div>

            <button
              onClick={() => toast.remove(t.id)}
              className="text-brand-muted hover:text-brand-text p-1 transition-colors rounded-lg hover:bg-slate-50 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
