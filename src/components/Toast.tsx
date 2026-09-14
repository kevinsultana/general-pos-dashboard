'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  title?: string;
  createdAt: number;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-9999 flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let borderClass = 'border-indigo-500/40';
        let bgClass = 'bg-slate-900/95';
        let icon = <Info className="w-5 h-5 text-indigo-400 shrink-0" />;
        let titleColor = 'text-indigo-200';

        if (toast.type === 'success') {
          borderClass = 'border-emerald-500/50 shadow-emerald-500/10';
          bgClass = 'bg-[#0f1d1a]/95';
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
          titleColor = 'text-emerald-300';
        } else if (toast.type === 'error') {
          borderClass = 'border-rose-500/50 shadow-rose-500/10';
          bgClass = 'bg-[#1e1014]/95';
          icon = <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
          titleColor = 'text-rose-300';
        } else if (toast.type === 'warning') {
          borderClass = 'border-amber-500/50 shadow-amber-500/10';
          bgClass = 'bg-[#1f190e]/95';
          icon = <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
          titleColor = 'text-amber-300';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border ${borderClass} ${bgClass} backdrop-blur-md shadow-xl transition-all animate-in slide-in-from-top-3 fade-in duration-200`}
          >
            {icon}
            <div className="flex-1 min-w-0 pr-1">
              {toast.title && (
                <div className={`text-xs font-semibold ${titleColor} mb-0.5`}>
                  {toast.title}
                </div>
              )}
              <div className="text-xs text-slate-200 leading-relaxed wrap-break-word">
                {toast.message}
              </div>
            </div>
            <button
              onClick={() => onClose(toast.id)}
              className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-white/5 transition shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
