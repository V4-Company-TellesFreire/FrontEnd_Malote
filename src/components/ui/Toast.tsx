import * as React from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = React.useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  const success = React.useCallback((msg: string, dur?: number) => addToast(msg, 'success', dur), [addToast]);
  const error = React.useCallback((msg: string, dur?: number) => addToast(msg, 'error', dur), [addToast]);
  const warning = React.useCallback((msg: string, dur?: number) => addToast(msg, 'warning', dur), [addToast]);
  const info = React.useCallback((msg: string, dur?: number) => addToast(msg, 'info', dur), [addToast]);

  const value = React.useMemo(
    () => ({ toast: addToast, success, error, warning, info }),
    [addToast, success, error, warning, info]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-toast flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
          {toasts.map((t) => (
            <ToastComponent key={t.id} toast={t} onClose={() => removeToast(t.id)} />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastComponent({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  const icon = React.useMemo(() => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-success-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-critical-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-warning-600" />;
      case 'info':
        return <Info className="h-5 w-5 text-info-600" />;
    }
  }, [toast.type]);

  const bgClasses = {
    success: 'bg-success-50 border-success-200 text-success-900',
    error: 'bg-critical-50 border-critical-200 text-critical-900',
    warning: 'bg-warning-50 border-warning-200 text-warning-900',
    info: 'bg-info-50 border-info-200 text-info-900',
  };

  return (
    <div
      className={cn(
        'flex items-center justify-between p-4 rounded-xl border shadow-lg w-full pointer-events-auto animate-toast-in',
        bgClasses[toast.type]
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-center gap-3">
        {icon}
        <p className="text-sm font-semibold tracking-wide">{toast.message}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 rounded-full text-neutral-400 hover:text-neutral-600 self-start"
        onClick={onClose}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
