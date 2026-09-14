'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastContainer, ToastItem, ToastType } from '../components/Toast';

interface ToastContextType {
  showToast: (message: string, type?: ToastType, title?: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', title?: string) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = {
        id,
        message,
        type,
        title,
        createdAt: Date.now(),
      };
      setToasts((prev) => [...prev, newToast]);

      // Auto dismiss after 4.5 seconds
      setTimeout(() => {
        removeToast(id);
      }, 4500);
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, title = 'Berhasil') => showToast(message, 'success', title),
    [showToast]
  );

  const error = useCallback(
    (message: string, title = 'Terjadi Kesalahan') => showToast(message, 'error', title),
    [showToast]
  );

  const info = useCallback(
    (message: string, title = 'Informasi') => showToast(message, 'info', title),
    [showToast]
  );

  const warning = useCallback(
    (message: string, title = 'Peringatan') => showToast(message, 'warning', title),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
