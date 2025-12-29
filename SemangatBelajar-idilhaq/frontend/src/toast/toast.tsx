import { createContext, useContext, useState, type ReactNode } from 'react';

// Tipe toast
type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  show: boolean;
  message: string;
  type: ToastType;
}

interface ToastContextProps {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'info',
  });

  // Tampilkan toast selama 2.5 detik
  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 2500);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast.show && (
        <div
          className={`
            fixed top-4 left-1/2 -translate-x-1/2 z-[9999]
            px-4 py-2 sm:px-6 sm:py-3 rounded-xl shadow-lg text-white font-semibold
            text-xs sm:text-sm max-w-[90vw] sm:max-w-xs text-center
            transition-all
            ${toast.type === 'success' ? 'bg-[#25E82F]' : ''}
            ${toast.type === 'error' ? 'bg-[#EE0000]' : ''}
            ${toast.type === 'info' ? 'bg-[#005EFF]' : ''}
          `}
          style={{
            wordBreak: 'break-word',
          }}
        >
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}
