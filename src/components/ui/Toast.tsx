"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

type ToastVariant = "success" | "error";
type ToastItem = { id: number; message: string; variant: ToastVariant };

type ToastApi = {
  show: (message: string, variant?: ToastVariant) => void;
  success: (message: string) => void;
  error: (message: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

/** Dispara toasts desde cualquier componente cliente. */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}

const DURATION_MS = 3200;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, variant: ToastVariant = "success") => {
      const id = (idRef.current += 1);
      setToasts((prev) => [...prev, { id, message, variant }]);
      setTimeout(() => dismiss(id), DURATION_MS);
    },
    [dismiss]
  );

  const api: ToastApi = {
    show,
    success: (m) => show(m, "success"),
    error: (m) => show(m, "error"),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[200] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6">
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onClose={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function Toast({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  const isError = toast.variant === "error";
  return (
    <div className="toast-in pointer-events-auto flex w-full max-w-sm items-center gap-3 border border-ink/15 bg-paper px-4 py-3 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.35)]">
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs leading-none ${
          isError ? "bg-ink text-paper" : "border border-ink bg-paper text-ink"
        }`}
      >
        {isError ? "✕" : "✓"}
      </span>
      <span className="flex-1 text-sm text-ink">{toast.message}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="shrink-0 text-ink/35 transition-colors hover:text-ink"
      >
        ✕
      </button>
    </div>
  );
}
