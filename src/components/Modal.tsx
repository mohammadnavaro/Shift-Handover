import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  widthClass?: string;
  actions?: ReactNode;
}

export default function Modal({ title, subtitle, onClose, children, widthClass = 'max-w-lg', actions }: ModalProps) {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm sm:items-center" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
        className={`my-auto w-full ${widthClass} rounded-2xl border border-stone-200 bg-stone-100 shadow-2xl`}
      >
        <header className="no-print flex items-start justify-between gap-4 border-b border-stone-200 px-6 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold text-stone-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-stone-600">{subtitle}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {actions}
            <button
              type="button"
              onClick={onClose}
              aria-label="بستن"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stone-300 text-stone-700 transition hover:border-stone-500 hover:text-stone-900"
            >
              <X size={16} aria-hidden />
            </button>
          </div>
        </header>
        <div className="max-h-[80vh] overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}
