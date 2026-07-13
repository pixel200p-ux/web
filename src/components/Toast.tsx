import { useState, useCallback, type ReactNode } from 'react';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

let toastId = 0;
const listeners: ((toast: Toast) => void)[] = [];

export function showToast(message: string, type: Toast['type'] = 'info') {
  const toast: Toast = { id: `toast-${++toastId}`, message, type };
  listeners.forEach(l => l(toast));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Toast) => {
    setToasts(prev => [...prev, toast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toast.id));
    }, 3000);
  }, []);

  useState(() => {
    listeners.push(addToast);
    return () => {
      const idx = listeners.indexOf(addToast);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  });

  const icons: Record<Toast['type'], ReactNode> = {
    success: <span className="text-emerald-500">&#10003;</span>,
    error: <span className="text-rose-500">!</span>,
    warning: <span className="text-amber-500">!</span>,
    info: <span className="text-blue-500">i</span>,
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className="flex items-center gap-3 rounded-lg bg-white px-4 py-3 shadow-lg dark:bg-slate-800"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
            {icons[t.type]}
          </span>
          <span className="text-sm text-slate-700 dark:text-slate-200">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
