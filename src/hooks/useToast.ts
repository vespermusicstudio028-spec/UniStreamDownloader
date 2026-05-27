import { useState, useCallback } from 'react';
import { ToastMessage } from '../types';

let toastIdCounter = 0;

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${++toastIdCounter}`;
    const newToast: ToastMessage = { id, duration: 4000, ...toast };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => removeToast(id), newToast.duration);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (title: string, body?: string) => addToast({ type: 'success', title, body }),
    error: (title: string, body?: string) => addToast({ type: 'error', title, body }),
    info: (title: string, body?: string) => addToast({ type: 'info', title, body }),
    warning: (title: string, body?: string) => addToast({ type: 'warning', title, body }),
  };

  return { toasts, toast, removeToast };
}
