import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: <CheckCircle size={18} className="text-healthy shrink-0" />,
  error: <XCircle size={18} className="text-alert shrink-0" />,
  warning: <AlertTriangle size={18} className="text-warning shrink-0" />,
  info: <Info size={18} className="text-primary shrink-0" />,
};

const BORDERS = {
  success: 'border-l-healthy',
  error: 'border-l-alert',
  warning: 'border-l-warning',
  info: 'border-l-primary',
};

const Toast = ({ toast, onRemove }) => {
  const [exiting, setExiting] = React.useState(false);

  const handleClose = () => {
    setExiting(true);
    setTimeout(() => onRemove(toast.id), 280);
  };

  React.useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`
        flex items-start gap-3 bg-surface border border-border border-l-4 ${BORDERS[toast.type]}
        rounded-lg shadow-2xl px-4 py-3 min-w-[300px] max-w-[400px] pointer-events-auto
        ${exiting ? 'toast-exit' : 'toast-enter'}
      `}
    >
      {ICONS[toast.type]}
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="text-sm font-semibold text-white leading-tight mb-0.5">{toast.title}</p>
        )}
        <p className="text-sm text-gray-400 leading-snug">{toast.message}</p>
      </div>
      <button
        onClick={handleClose}
        className="text-gray-500 hover:text-gray-300 transition-colors mt-0.5 shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const addToast = useCallback(({ type = 'info', title, message, duration }) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, type, title, message, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (message, title) => addToast({ type: 'success', message, title }),
    error: (message, title) => addToast({ type: 'error', message, title }),
    warning: (message, title) => addToast({ type: 'warning', message, title }),
    info: (message, title) => addToast({ type: 'info', message, title }),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
