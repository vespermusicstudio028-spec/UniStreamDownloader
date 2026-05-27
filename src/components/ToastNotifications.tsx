import React from 'react';
import { ToastMessage } from '../../types';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';

interface ToastProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

const icons = {
  success: <CheckCircle2 size={18} style={{ color: '#10b981', flexShrink: 0 }} />,
  error: <XCircle size={18} style={{ color: '#f43f5e', flexShrink: 0 }} />,
  info: <Info size={18} style={{ color: '#06b6d4', flexShrink: 0 }} />,
  warning: <AlertTriangle size={18} style={{ color: '#f59e0b', flexShrink: 0 }} />,
};

export default function ToastNotifications({ toasts, onRemove }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type} animate-slide-up`}>
          {icons[toast.type]}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {toast.title}
            </div>
            {toast.body && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                {toast.body}
              </div>
            )}
          </div>
          <button
            onClick={() => onRemove(toast.id)}
            className="btn-ghost btn-sm"
            style={{ padding: '2px', flexShrink: 0 }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
